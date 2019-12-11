# SDAIS = Smart Deep AI for Search 
# Commentiamo tutte le funzioni e classi seguendo formato Doxygen
from concurrent.futures import ThreadPoolExecutor as PoolExecutor
from .document_model import DocumentModel
from .semantic_search import Semantic_Search, BERT_distance, BPEmb_Embedding_distance
from .salient_sentences import from_document_to_salient
from .policy import Policy
from .summarization import ModelSummarizer
from .transitions import transitions_handler
import spacy
from bpemb import BPEmb
from spacy_readability import Readability

class DocumentsAdaptation():
    def __init__(self, config, max_workers=0, verbose=False):
        self.config = config
        self.available_languages = {'en':'en_core_web_sm','de':'de_core_news_sm',
                            'fr':'fr_core_news_sm','es':'es_core_news_sm', 
                            'it':'it_core_news_sm', 'multi':'xx_ent_wiki_sm'}
        # we can use also BERT distance, but it's slower and does not support multi language
        # self.distance = BERT_distance()
        print("Preloading Word Embeddings for selected languages...")
        # list of the language we want to suppport
        dim = 200
        vs = 200000
        self.languages = config.languages

        # Checking for available languages
        for lang in self.languages:
            if lang not in self.available_languages:
                raise Exception("Sorry, language '{}' not yet supported".format(lang))

        self.verbose = verbose
        self.max_workers = max_workers
        self.transition = {l:transitions_handler(self.config.transition_data_path) for l in self.languages}
        self.model_summarizer = {l:ModelSummarizer(config, lang=l, verbose=self.verbose) for l in self.languages}
        self.embedder = {l:BPEmb(lang=l, dim=dim, vs = vs) for l in self.languages}
       
    # Input: json contenente informazioni dell'utente passate dall'applicazione
    # Out: serie di keyword da passare a SDAIS per la generazione di queries specializzate
    # Formato output: {
    #                  "keyword1":["keyword1_expanded_1","keyword1_expanded_2","keyword1_expanded_3"],
    #                   "keyword2":["keyword2_expanded_2","keyword2_expanded_3","keyword2_expanded_4"]
    #                   ....
    #                   }
    def update_config(self, config):
        self.config = config

    def language_assertion(self, lang):
        if lang not in self.languages:
                raise Exception("Sorry, '{}' not yet supported".format(lang))

    def get_language_stopwords(self, user):
        if (user.language in self.available_languages):
            spacy_nlp = spacy.load(self.available_languages[user.language])
        else:
            spacy_nlp = spacy.load(self.available_languages['multi'])

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
    def get_tailored_text(self, results, user, use_transitions=True):
        if len(results)<=0:
            return "Content not found"

        # Loading correct language for BPE embeddings
        if user.language in self.embedder:
            embedder = self.embedder[user.language]
        else:
            embedder = self.embedder['en']
        user.embed_tastes(embedder)
        stop_words = self.get_language_stopwords(user)        
        # Map result in DocumentModel object

        # Load spacy dictionary for readibility evaluation
        if (user.language in self.available_languages):
            nlp = spacy.load(self.available_languages[user.language])
        else:
            nlp = spacy.load(self.available_languages['multi'])
        read = Readability()
        nlp.add_pipe(read, last=True)

        documents = [DocumentModel(x, user, nlp, stop_words=stop_words, uid=index) for index, x in enumerate(results)]
        # Remove document without content
        documents = list(filter(lambda x: bool(x.plain_text), documents))
        # sort on the IR value
        #sorted(documents, key=lambda x: x.score, reverse=True)

        if len(documents) <= 0:
            return "Content not found"

        if self.verbose:
            print("Total chars in documents: {}".format(sum([len(doc.plain_text) for doc in documents])))
            print(["{} chars in document".format(len(doc.plain_text)) for doc in documents])

        # Parallel function for evaluate the document's affinity 
        def create_list_salient_sentences(document):
            document.user_readability_score() # QUESTION?
            salient_sentences = from_document_to_salient(document, embedder, self.config, user.tastes)
            return salient_sentences

        with PoolExecutor(max_workers=self.max_workers) as executor:
            futures = executor.map(create_list_salient_sentences, documents) 
        salient_sentences = list(futures)
        salient_sentences = [x for s in salient_sentences for x in s]

        # policy on sentences
        policy = Policy(salient_sentences, user, self.config.max_cluster_size)
        policy.auto()

        # create batch of sentences for summarization model 
        batch_sentences, num_sentences, keywords = self.model_summarizer[user.language].to_batch(policy.results, aggregate_from_same_doc=True)
        summaries = self.model_summarizer[user.language].inference(batch_sentences, num_sentences)

        if self.verbose:
            print("####----- Tailored result -----####")

        tailored_result = ''
        for index, res in enumerate(zip(keywords, summaries)):
            keyword, summary = res
            paragraph = ''

            if (use_transitions and index>0):
                paragraph += self.transition[user.language].extract_transition(user.language, topic=keyword)+'\n'
            paragraph += summary+'\n'

            if self.verbose:
                print("[{}]".format(keyword.upper()))
                print("{}".format(paragraph))
                
            tailored_result += paragraph

        return tailored_result
