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
        languages = config.languages

        # Checking for available languages
        for lang in languages:
            if lang not in self.available_languages:
                raise Exception("Sorry, '{}' not yet supported".format(lang))

        self.verbose = verbose
        self.max_workers = max_workers
        self.transition = {l:transitions_handler(self.config.transition_data_path) for l in languages}
        self.model_summarizer = {l:ModelSummarizer(config, lang=l, verbose=self.verbose) for l in languages}
        self.embedder = {l:BPEmb(lang=l, dim=dim, vs = vs) for l in languages}
       
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
    def get_tailored_text(self, results, user, config):
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

        documents = list(map(lambda x: DocumentModel(x, user, nlp, stop_words=stop_words), results))
        # Remove document without content
        documents = list(filter(lambda x: bool(x.plain_text), documents))
        # sort on the IR value
        sorted(documents, key=lambda x: x.score, reverse=True)

        if len(documents) <= 0:
            return "Content not found"

        if self.verbose:
            print("Total words in documents: {}".format(sum([len(doc.plain_text) for doc in documents])))
            print(["{} in document".format(len(doc.plain_text)) for doc in documents])

        # Parallel function for evaluate the document's affinity 
        def create_list_salient_sentences(document):
            document.user_readability_score() # QUESTION?
            salient_sentences = from_document_to_salient(document, embedder, config)
            return salient_sentences

        with PoolExecutor(max_workers=self.max_workers) as executor:
            futures = executor.map(create_list_salient_sentences, documents) 
        salient_sentences = list(futures)
        salient_sentences = [x for s in salient_sentences for x in s]

        # policy on sentences
        policy = Policy(salient_sentences, user)
        policy.auto()
        #policy.print_results(5)

        # create batch of sentences for summarization model 
        batch_sentences = []
        clusters = []
        num_sentences = []

        for cluster in policy.results:
            limited_cluster = policy.results[cluster][:self.config.max_cluster_size]
            if len(limited_cluster) > 0:
                clusters.append(cluster)
                batch_sentences.append(''.join( [x[1] for x in limited_cluster] ))
                num_sentences.append(len(limited_cluster))
            print("Batch \"{}\" length: {} chars".format(cluster, len(limited_cluster)))

        if self.verbose:
            print("Sentences per cluster: {}".format(list(zip(clusters, num_sentences))))
            print("###!-- Starting summarization")
        summaries = self.model_summarizer[user.language].inference(batch_sentences, num_sentences)

        if self.verbose:
            print("####----- Tailored result -----####")

        tailored_result = ''
        for index, res in enumerate(zip(clusters, summaries)):
            cluster, summary = res

            if self.verbose:
                print("{}".format(cluster.upper()))
                print("{}".format(summary))

            if (index>0):
                tailored_result += self.transition[user.language].extract_transition(user.language, topic=cluster)+'\n'
            tailored_result += summary+'\n'

        return tailored_result
