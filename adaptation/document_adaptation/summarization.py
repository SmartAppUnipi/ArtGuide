#!/usr/bin/env python
"""
    Main training workflow
"""
from __future__ import division

import os
import random
import time

import time
import torch
from summarizer import Summarizer
from transformers import *

import nltk
nltk.download('punkt')


class ModelSummarizer():
    def __init__(self, config, lang=None, custom_model=None, custom_tokenizer=None, tokenizer=None, verbose=None, **kwargs):
        self.config = config
        if lang == 'it':
            from spacy.lang.it import Italian
            self.language = Italian
        elif lang == 'en':
            from spacy.lang.en import English
            self.language = English
        
        if not custom_model:
            custom_model = BertModel.from_pretrained('bert-base-uncased', output_hidden_states=True)
        if not custom_tokenizer:
            custom_tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

        self.model = Summarizer(language=self.language, custom_model=custom_model, custom_tokenizer=custom_tokenizer, **kwargs)

    def inference(self, txts, num_sentences=[], ratio=0.5, **kwargs):
        result = []
        for idx, txt in enumerate(txts):
            _ratio = ratio
            if len(num_sentences)>=idx:
                weight = num_sentences[idx] / sum(num_sentences)
                _ratio = min(self.config.max_sentences / (num_sentences[idx]*weight), 0.8)
                # print(weight, _ratio)
            pred = self.model(txt, ratio=_ratio, min_length=40, **kwargs)
            result.append(''.join(pred))
        return result

# class ABS_Summarizzer():
#     def __init__(self, args, checkpoint=None, lang="en", shuffle=True, verbose=False, nlp_tokenizer=None):
#         self.args = deepcopy(args)
#         self.lang = lang
#         self.shuffle = shuffle if shuffle and type == "ext" else False
#         # Setting up Stanford Tokenizer Pipeline
#         stanfordnlp.download(self.lang)
#         self.nlp_tokenizer = nlp_tokenizer if nlp_tokenizer else stanfordnlp.Pipeline(
#             processors='tokenize', lang=self.lang, tokenize_pretokenized=True)
#         # Set device
#         self.device = "cpu" if self.args.visible_gpus == '-1' else "cuda"
#         self.device_id = 0 if self.device == "cuda" else -1
#         # Import checkpoint
#         # self.checkpoint = checkpoint if checkpoint else self.args.test_from
#         self.checkpoint = checkpoint if checkpoint else os.path.join(
#             checkpoint_path, self.model_checkpoints['abs'])
#         # Load and setting up model predictor
#         checkpoint = torch.load(self.checkpoint, map_location=self.device)

#         self.model = AbsSummarizer(self.args, self.device, checkpoint)
#         self.model.eval()

#         tokenizer = BertTokenizer.from_pretrained(
#             'bert-base-uncased', do_lower_case=self.args.lower, cache_dir=self.args.temp_dir)
#         symbols = {'BOS': tokenizer.vocab['[unused0]'], 'EOS': tokenizer.vocab['[unused1]'],
#             'PAD': tokenizer.vocab['[PAD]'], 'EOQ': tokenizer.vocab['[unused2]']}
#         self.predictor = build_predictor(
#             self.args, tokenizer, symbols, self.model)

#     def inference(self, texts, step=0):
#         test_iter = data_loader.Dataloader(self.args, self.preprocess_data(texts),  # load_dataset(self.args, 'test', shuffle=False),#
#                                         self.args.test_batch_size, self.device,
#                                         shuffle=False, is_test=True)

#         preds, _, src = self.predictor.translate(test_iter, step)
#         preds = list(map(lambda s: self.beautify_text(s), preds))
#         return preds

#     def beautify_text(self, text):
#         sentences = list(map(lambda s: s.strip().capitalize(),
#                          text.replace('<q>', '.').split('.')))
#         res = ''
#         if len(sentences) > 1:
#             for i, _ in enumerate(sentences[:-1]):
#                 if len(sentences[i]) > 0 and len(sentences[i+1]) > 0:
#                     if sentences[i][-1].isdigit() and sentences[i+1][0].isdigit():
#                         res += sentences[i]+'.'
#                     else:
#                         res += sentences[i]+'.\n'
#             res += sentences[-1]+'.'
#         else:
#             res = sentences
#         return res

#     def preprocess_data(self, texts):
#         res = []
#         for text in texts:
#             tmp = {"src": [], "tgt": ''}
#             # Tokenize
#             doc = self.nlp_tokenizer(text)
#             # Format to lines
#             for i, s in enumerate(doc.sentences):
#                 sentences = [' '.join([token.text for token in s.tokens])]
#                 tmp["src"].append(sentences)
#             if (self.shuffle):
#                 random.shuffle(tmp["src"])
#             # Format to BERT
#             res.append(tmp)
#         yield _format_to_bert(res, self.args)
#
# class ModelSummarizer():
#     def __init__(self, args, type=None, lang="en", verbose=False, checkpoint_path='', pretrained=True):
#         self.model_checkpoints = {
#             "abs": args.checkpoint_abs,
#             "ext": args.checkpoint_ext
#             }
#         self.lang = lang
#         self.type= type
#         self.verbose = verbose
#         self.checkpoint_path = checkpoint_path

#         if pretrained:
#             self.load_pretrained(self.checkpoint_path)

#         if self.verbose:
#             start_time = time.time()

#         if self.type:
#             if self.type == "ext":
#                 self.model = EXT_Summarizer(args, lang=self.lang,  model='bert-large-uncased')
#             elif self.type == "abs":
#                 self.model = ABS_Summarizer(args, lang=self.lang, checkpoint=os.path.join(self.checkpoint_path, self.model_checkpoints['abs']))
#         else:
#             if self.lang == "en":
#                 self.model = ABS_Summarizer(args, lang=self.lang, checkpoint=os.path.join(self.checkpoint_path, self.model_checkpoints['abs']))
#             else:
#                 self.model = EXT_Summarizer(args, lang=self.lang,  model='bert-large-uncased')

#         if self.verbose:
#             print("###--- Settin up model: %s seconds ---###" % (time.time() - start_time))

#     def load_pretrained(self, checkpoint_path):
#         if not os.path.exists(checkpoint_path):
#             os.mkdir(checkpoint_path)
#         if len(os.listdir(checkpoint_path)) == 0:
#             print('Chekpoint\'s folder "{}" is empty. Downloading pretrained checkpoints'.format(checkpoint_path))
#         else:
#             if self.verbose:
#                 print('Chekpoints\'s folder "{}" is not empty. Nothing to do.'.format(checkpoint_path))
#             return
#         file_ids = ["1-IKVCtc4Q-BdZpjXc4s70_fRsWnjtYLr"]
#         for file_id in file_ids:
#             gdd.download_file_from_google_drive(file_id=file_id,
#                                         dest_path= os.path.join(checkpoint_path, file_id+'.zip'),
#                                         unzip=True,
#                                         showsize=True
#                                         )
#         time.sleep(5)
#         print("Pretrained BERT checkpoints downloaded!")

#     def inference(self, texts):
#         if self.verbose:
#             start_time = time.time()

#         preds = self.model.inference(texts)

#         if self.verbose:
#             print("###--- Predicted in %s seconds ---###" % (time.time() - start_time))
#             for i, summary in enumerate(preds):
#                 print("--- Summary {} , reduced by {} words---".format(i, len(texts[0])-len(summary)) )
#                 print(summary)

#         return preds


if __name__ == '__main__':
    txt = '''
    The Leaning Tower of Pisa (Italian: Torre pendente di Pisa) or simply the Tower of Pisa (Torre di Pisa [ˈtorre di ˈpiːza, - ˈpiːsa]) is the campanile, or freestanding bell tower, of the cathedral of the Italian city of Pisa, known worldwide for its nearly four-degree lean, the result of an unstable foundation.

    The tower is situated behind the Pisa Cathedral and is the third-oldest structure in the city's Cathedral Square (Piazza del Duomo), after the cathedral and the Pisa Baptistry.

    The height of the tower is 55.86 metres (183.27 feet) from the ground on the low side and 56.67 metres (185.93 feet) on the high side.

    The width of the walls at the base is 2.44 m (8 ft 0.06 in). Its weight is estimated at 14,500 metric tons (16,000 short tons).

    The tower has 296 or 294 steps; the seventh floor has two fewer steps on the north-facing staircase.

    The tower began to lean during construction in the 12th century, due to soft ground which could not properly support the structure's weight, and it worsened through the completion of construction in the 14th century.

    By 1990 the tilt had reached 5.5 degrees. The structure was stabilized by remedial work between 1993 and 2001, which reduced the tilt to 3.97 degrees.
    '''

    txt_ita = '''
    La torre di Pisa (popolarmente torre pendente e, a Pisa, la Torre) è il campanile della cattedrale di Santa Maria Assunta, nella celeberrima piazza del Duomo di cui è il monumento più famoso per via della caratteristica pendenza, simbolo di Pisa e fra i simboli iconici d'Italia.

    Si tratta di un campanile a sé stante alto 57 metri (58,36 metri considerando il piano di fondazione) costruito nell'arco di due secoli, tra il dodicesimo e il quattordicesimo secolo. Con una massa di 14.453 tonnellate, vi predomina la linea curva, con giri di arcate cieche e sei piani di loggette.

    La pendenza è dovuta a un cedimento del terreno sottostante verificatosi già nelle prime fasi della costruzione. L'inclinazione dell'edificio misura 3,9° rispetto all'asse verticale. La torre è gestita dall'Opera della Primaziale Pisana, ente che gestisce tutti i monumenti della piazza del Duomo di Pisa.

    È stata proposta come una delle sette meraviglie del mondo moderno.
    '''
    custom_model = BertModel.from_pretrained('bert-large-uncased', output_hidden_states=True)
    custom_tokenizer = BertTokenizer.from_pretrained('bert-large-uncased')

    print("Setup model...")
    print("#--- Original ---#")
    print(txt)

    model = ModelSummarizer(None,
        lang="en",
        custom_model=custom_model,
        custom_tokenizer=custom_tokenizer,
        greedyness=0.45,
        hidden=-2,
        reduce_option='mean',
        random_state= 420,
    )
    
    start = time.time()
    out = model.inference([txt, txt_ita], ratio=0.5, min_length=40)
    print("predixted in {}".format(time.time() - start))
    for i,summ in enumerate(out):
        print("#-- Summary {} - diff char {}--#".format(i, len(txt)-len(summ)))
        print(summ)
