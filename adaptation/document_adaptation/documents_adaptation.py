# SDAIS = Smart Deep AI for Search 
# Commentiamo tutte le funzioni e classi seguendo formato Doxygen
from .document_model import DocumentModel


class DocumentsAdaptation():
    def __init__(self):
        self.available_languages = {'en':'en_core_web_sm','de':'de_core_news_sm',
                            'fr':'fr_core_news_sm','es':'es_core_news_sm','pt':'pt_core_news_sm',
                            'it':'it_core_news_sm','nl':'nl_core_news_sm','el':'el_core_news_sm',  
                            'nb':'nb_core_news_sm','lt':'lt_core_news_sm', 'multi':'xx_ent_wiki_sm'}      

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

        spacy_lang = getattr(spacy.lang, user.language, default)
        
        if spacy_lang:
            stop_words = spacy_lang.stop_words.STOP_WORDS
        else:
            stop_words = []

        return stop_words


    def get_keywords(self, tastes):
        res = {}
        for taste in tastes:
            res[taste] = [taste]
        return res

    # Input: json contenente articoli ricevuti da SDAIS 
    # Out: articolo filtrato im base alle preferenze dell'utente 
    # Formato output: string
    # Proto: il primo articolo per ora puo' andare bene
    def get_tailored_text(self, results, user):

        stop_words = self.get_language_stopwords(user)

        if len(results)<=0:
            return "Content not found"
        
        documents =  []      
        for result in results:
            documents.append( DocumentModel(result, user, stop_words=stop_words) )
            # salient_sentences = documents.salient_sentences()
        best_document = documents[0]
        # best_document = max(documents.affinity_score())
        return best_document.plain_text
        

    
