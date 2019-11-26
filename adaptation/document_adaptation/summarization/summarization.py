#!/usr/bin/env python
"""
    Main training workflow
"""
from __future__ import division

import os
import random
import time
from copy import deepcopy

import time
import torch
from .others.tokenization import BertTokenizer
from summarizer import Summarizer
from transformers import BertTokenizer as RealBertTokenizer, BertModel

from .models import data_loader, model_builder
from .models.data_loader import load_dataset
from .models.model_builder import AbsSummarizer
from .models.predictor import build_predictor
from .preprocess import _format_to_bert

import stanfordnlp
from google_drive_downloader import GoogleDriveDownloader as gdd

from args import args

args.gpu_ranks = [int(i) for i in range(len(args.visible_gpus.split(',')))]
args.world_size = len(args.gpu_ranks)
os.environ["CUDA_VISIBLE_DEVICES"] = args.visible_gpus


class ABS_Summarizer():
    def __init__(self, args, checkpoint=None, lang="en", shuffle=True, nlp_tokenizer=None):
        self.args = deepcopy(args)
        self.lang = lang
        self.shuffle = shuffle if shuffle and type == "ext" else False
        # Setting up Stanford Tokenizer Pipeline
        stanfordnlp.download(self.lang)
        self.nlp_tokenizer = nlp_tokenizer if nlp_tokenizer else stanfordnlp.Pipeline(
            processors='tokenize', lang=self.lang, tokenize_pretokenized=True)
        # Set device
        self.device = "cpu" if self.args.visible_gpus == '-1' else "cuda"
        self.device_id = 0 if self.device == "cuda" else -1
        # Import checkpoint
        # self.checkpoint = checkpoint if checkpoint else self.args.test_from
        self.checkpoint = checkpoint if checkpoint else os.path.join(
            checkpoint_path, self.model_checkpoints['abs'])
        # Load and setting up model predictor
        checkpoint = torch.load(self.checkpoint, map_location=self.device)

        self.model = AbsSummarizer(self.args, self.device, checkpoint)
        self.model.eval()

        tokenizer = BertTokenizer.from_pretrained(
            'bert-base-uncased', do_lower_case=self.args.lower, cache_dir=self.args.temp_dir)
        symbols = {'BOS': tokenizer.vocab['[unused0]'], 'EOS': tokenizer.vocab['[unused1]'],
            'PAD': tokenizer.vocab['[PAD]'], 'EOQ': tokenizer.vocab['[unused2]']}
        self.predictor = build_predictor(
            self.args, tokenizer, symbols, self.model)

    def inference(self, texts, step=0):
        test_iter = data_loader.Dataloader(self.args, self.preprocess_data(texts),  # load_dataset(self.args, 'test', shuffle=False),#
                                        self.args.test_batch_size, self.device,
                                        shuffle=False, is_test=True)

        preds, _, src = self.predictor.translate(test_iter, step)
        preds = list(map(lambda s: self.beautify_text(s), preds))
        return preds

    def beautify_text(self, text):
        sentences = list(map(lambda s: s.strip().capitalize(),
                         text.replace('<q>', '.').split('.')))
        res = ''
        if len(sentences) > 1:
            for i, _ in enumerate(sentences[:-1]):
                if len(sentences[i]) > 0 and len(sentences[i+1]) > 0:
                    if sentences[i][-1].isdigit() and sentences[i+1][0].isdigit():
                        res += sentences[i]+'.'
                    else:
                        res += sentences[i]+'.\n'
            res += sentences[-1]+'.'
        else:
            res = sentences
        return res

    def preprocess_data(self, texts):
        res = []
        for text in texts:
            tmp = {"src": [], "tgt": ''}
            # Tokenize
            doc = self.nlp_tokenizer(text)
            # Format to lines
            for i, s in enumerate(doc.sentences):
                sentences = [' '.join([token.text for token in s.tokens])]
                tmp["src"].append(sentences)
            if (self.shuffle):
                random.shuffle(tmp["src"])
            # Format to BERT
            res.append(tmp)
        yield _format_to_bert(res, self.args)


class EXT_Summarizer():
    def __init__(self, args, lang=None, model=None, tokenizer=None):
        self.args = args
        if lang == 'it':
            from spacy.lang.it import Italian
            self.language = Italian
        elif lang == 'en':
            from spacy.lang.en import English
            self.language = English
        else:
            pass

        self.model = Summarizer(language=self.language, model=model)

    def inference(self, txts):
        length = sum([len(t) for t in txts])
        result = []
        for txt in txts:
            pred = self.model(txt, min_length=min(
                length, self.args.min_length), max_length=self.args.max_length)
            result.append(''.join(pred))
        return result


class ModelSummarizer():
    def __init__(self, args, type=None, lang="en", verbose=False, checkpoint_path='', pretrained=True):
        self.model_checkpoints = {
            "abs": args.checkpoint_abs,
            "ext": args.checkpoint_ext
            }
        self.lang = lang
        self.type= type
        self.verbose = verbose 
        self.checkpoint_path = checkpoint_path

        if pretrained:
            self.load_pretrained(self.checkpoint_path)

        if self.verbose:
            start_time = time.time()

        if self.type:
            if self.type == "ext":
                self.model = EXT_Summarizer(args, lang=self.lang,  model='bert-large-uncased')
            elif self.type == "abs":
                self.model = ABS_Summarizer(args, lang=self.lang, checkpoint=os.path.join(self.checkpoint_path, self.model_checkpoints['abs']))
        else:
            if self.lang == "en":
                self.model = ABS_Summarizer(args, lang=self.lang, checkpoint=os.path.join(self.checkpoint_path, self.model_checkpoints['abs']))
            else:
                self.model = EXT_Summarizer(args, lang=self.lang,  model='bert-large-uncased')

        if self.verbose:
            print("###--- Settin up model: %s seconds ---###" % (time.time() - start_time))

    def load_pretrained(self, checkpoint_path):
        if len(os.listdir(checkpoint_path)) == 0:
            print('Chekpoint\'s folder "{}" is empty. Downloading pretrained checkpoints'.format(checkpoint_path))
        else:
            if self.verbose:
                print('Chekpoints\'s folder "{}" is not empty. Nothing to do.'.format(checkpoint_path))
            return
        file_ids = ["1-IKVCtc4Q-BdZpjXc4s70_fRsWnjtYLr"]
        for file_id in file_ids:
            gdd.download_file_from_google_drive(file_id=file_id,
                                        dest_path= os.path.join(checkpoint_path, file_id+'.zip'),
                                        unzip=True,
                                        showsize=True
                                        )
        time.sleep(5)
        print("Pretrained BERT checkpoints downloaded!")

    def inference(self, texts):
        if self.verbose:
            start_time = time.time()

        preds = self.model.inference(texts)

        if self.verbose:
            print("###--- Predicted in %s seconds ---###" % (time.time() - start_time))
            for i, summary in enumerate(preds): 
                print("--- Summary {} , reduced by {} words---".format(i, len(texts[0])-len(summary)) )
                print(summary)

        return preds
        
