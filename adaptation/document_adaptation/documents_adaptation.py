# SDAIS = Smart Deep AI for Search 
# Commentiamo tutte le funzioni e classi seguendo formato Doxygen
from concurrent.futures import ThreadPoolExecutor as PoolExecutor
from .document_model import DocumentModel
from .semantic_search import Semantic_Search, BERT_distance, BPEmb_Embedding_distance
import spacy

class DocumentsAdaptation():
    def __init__(self, max_workers=0, verbose=False):
        self.available_languages = {'en':'en_core_web_sm','de':'de_core_news_sm',
                            'fr':'fr_core_news_sm','es':'es_core_news_sm', 
                            'it':'it_core_news_sm', 'multi':'xx_ent_wiki_sm'}
        # we can use also BERT distance, but it's slower and does not support multi language
        # self.distance = BERT_distance()
        print("Preloading Word Embeddings for supported languages...")
        # list of the language we want to suppport
        language = ["en", "it"]
        self.distance = {l:BPEmb_Embedding_distance(lang = l) for l in language}
        self.verbose = verbose
        self.max_workers = max_workers

    # Input: json contenente informazioni dell'utente passate dall'applicazione
    # Out: serie di keyword da passare a SDAIS per la generazione di queries specializzate
    # Formato output: {
    #                  "keyword1":["keyword1_expanded_1","keyword1_expanded_2","keyword1_expanded_3"],
    #                   "keyword2":["keyword2_expanded_2","keyword2_expanded_3","keyword2_expanded_4"]
    #                   ....
    #                   }

    def get_language_stopwords(self, user):
        if (user.language in self.available_languages):
            spacy_nlp = spacy.load(self.available_languages[user.language])
        else:
            spacy_nlp =  spacy.load(self.available_languages['multi'])

        spacy_lang = getattr(spacy.lang, user.language, None)
        
        if spacy_lang:
            stop_words = spacy_lang.stop_words.STOP_WORDS
        else:
            stop_words = []
        
        return stop_words


    def get_keywords(self, tastes):
        res = {}
        for taste in tastes:
            res[taste] = [taste]
        if self.verbose:
            print("Expanded keywords: ",res)
        return res

    # Input: json contenente articoli ricevuti da SDAIS 
    # Out: articolo filtrato im base alle preferenze dell'utente 
    # Formato output: string
    # Proto: il primo articolo per ora puo' andare bene
    def get_tailored_text(self, results, user):
        if len(results)<=0:
            return "Content not found"

        # Loading correct language for BPE embeddings
        if user.language in self.distance:
            search_engine = Semantic_Search(self.distance[user.language])
        else:
            search_engine = Semantic_Search(self.distance['en'])

        stop_words = self.get_language_stopwords(user)        
        # Map result in DocumentModel object
        documents = list(map(lambda x: DocumentModel(x, user, stop_words=stop_words), results))
        # Remove document without content
        documents = list(filter(lambda x: bool(x.plain_text), documents))

        if len(documents) <= 0:
            return "Content not found"

        if self.verbose:
            print("Total words in documents: {}".format(sum([len(doc.plain_text) for doc in documents])))
            print(["{} in document".format(len(doc.plain_text)) for doc in documents])

        # Parallel function for evaluate the document's affinity 
        def calc_document_affinity(document):
            salient_sentences = document.salient_sentences()
            results = search_engine.find_most_similar_multiple_keywords(salient_sentences, user.tastes, verbose=False)
            read_score = document.user_readability_score()
            sentences_scored = document.affinity_score_single_sentence(results, read_score)
            return sentences_scored

        with PoolExecutor(max_workers=self.max_workers) as executor:
            futures = executor.map(calc_document_affinity, documents) 
        salient_sentences = list(futures)
        salient_sentences = [x for s in salient_sentences for x in s]
        
        # Policy da cambiare
        # documents.sort(key=lambda x: (x.readability_score*10000)+x.affinity_score, reverse=True )

        if self.verbose:
            print("Ordered documents")
            print([{"title":doc.title, "url":doc.url, "affinity_score":doc.affinity_score, 'readability_score':doc.readability_score} for index, doc in enumerate(documents)])

        return salient_sentences
