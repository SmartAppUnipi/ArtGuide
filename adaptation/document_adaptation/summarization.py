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
            # If txt is not empty
            if len(txt) > 0:
                # Adaptive scale ration based on the items in the cluster
                if len(num_sentences)>=idx:
                    weight = num_sentences[idx] / sum(num_sentences)
                    _ratio = min(self.config.max_sentences / (num_sentences[idx]*weight), 0.8)
                    # print(weight, _ratio)
                pred = self.model(txt, ratio=_ratio, min_length=40, **kwargs)
            else:
                pred = ''
            result.append(''.join(pred))
        return result

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
