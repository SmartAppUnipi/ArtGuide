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

def getSpacyLang(lang='en'):
    language = None
    if lang == 'it':
        from spacy.lang.it import Italian
        language = Italian
    else:
        from spacy.lang.en import English
        language = English

    return language

class ModelSummarizer():
    def __init__(self, config, lang=None, custom_model=None, custom_tokenizer=None, tokenizer=None, verbose=None, **kwargs):
        self.config = config
        self.verbose = verbose
        self.language = getSpacyLang(lang)
        
        if not (custom_model and custom_tokenizer):
            custom_model, custom_tokenizer = self.get_pretrained_language(lang)

        self.model = Summarizer(language=self.language, custom_model=custom_model, custom_tokenizer=custom_tokenizer, **kwargs)

    def get_pretrained_language(self, lang):
        if lang=='en':
            custom_model = RobertaModel.from_pretrained('distilroberta-base', output_hidden_states=True)
            custom_tokenizer = RobertaTokenizer.from_pretrained('distilroberta-base')
        else:
            custom_model = DistilBertModel.from_pretrained('distilbert-base-multilingual-cased', output_hidden_states=True)
            custom_tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-multilingual-cased')
        return custom_model, custom_tokenizer

    def inference(self, txts, num_sentences=[], ratio=0.5, **kwargs):
        result = []
        for idx, txt in enumerate(txts):
            _ratio = ratio
            # If txt is not empty
            if len(txt) > 0:
                # Adaptive scale ration based on the items in the cluster
                if len(num_sentences)>=idx:
                    weight = num_sentences[idx] / sum(num_sentences)
                    _ratio = min((self.config.max_sentences*weight) / num_sentences[idx], 0.8)
                    if (self.verbose):
                        print("Wehight-ratio on keyword: {}, {}".format(weight, _ratio))
                pred = self.model(txt, ratio=_ratio, min_length=40, **kwargs)
            else:
                pred = ''
            result.append(''.join(pred))
        return result

    def to_batch(self, clusters, aggregate_from_same_doc=True):
        if (aggregate_from_same_doc):
            clusters = self.aggregate_from_same_doc(clusters)
        ''' Create batch of sentences coming from policy.results '''
        batch_sentences = []
        num_sentences = []
        keywords = []

        for keyword in clusters:
            # Da rimuovere
            # limited_cluster = policy.results[cluster][:self.config.max_cluster_size]
            sentences = clusters[keyword]
            if len(sentences) > 0:
                keywords.append(keyword)
                batch_sentences.append(''.join( [x.sentence for x in sentences] ))
                num_sentences.append(len(sentences))
        if self.verbose:
            print("Batch, num_sentences: {}".format(list(zip(clusters, num_sentences))))

        return batch_sentences, num_sentences, keywords

    def aggregate_from_same_doc(self, clusters):
        # Flatting clusters O(n)
        flat_clusters = []
        keywords = []
        for keyword in clusters:
            keywords.append(keyword)
            flat_clusters += [(keyword, x) for x in clusters[keyword]]
        # ~O(n^2)
        new_flat_clusters = []
        for couple in flat_clusters:
            keyword, target = couple
            # check in element is already in new_flat_clusters
            if any((x[1].document_uid == target.document_uid and x[1].position_in_document == target.position_in_document) for x in new_flat_clusters):
                continue
            else:
                from_same_doc = [x for x in flat_clusters if x[1].document_uid == target.document_uid]
                from_same_doc.sort(key=lambda x: x[1].position_in_document)
                new_flat_clusters += from_same_doc
        # refactoring cluster O(n)
        new_clusters = {}
        for key in keywords:
            new_clusters[key] = []
        for couple in new_flat_clusters:
            keyword, target = couple
            new_clusters[keyword].append(target)

        return new_clusters

         

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
