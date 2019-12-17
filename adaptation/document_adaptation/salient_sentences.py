import numpy as np
import scipy
from rake_nltk import Rake
from gensim.summarization.summarizer import summarize
from scipy.spatial import distance


def rake(sentence, stopwords):
    # https://pypi.org/project/rake-nltk/
    r = Rake(stopwords=stopwords)
    r.extract_keywords_from_text(sentence)
    raked_sentences = r.get_ranked_phrases()
    return raked_sentences

def from_document_to_salient(document, embedder, config, tastes, ratio=0.3, word_count=None, split=True):
    #https://radimrehurek.com/gensim/summarization/summariser.html
    try:
        summarized_sentences = summarize(document.normalized_text, ratio=ratio, word_count=word_count, split=split)
    except:
        summarized_sentences = []
        print("Error, we were not able to find the salient sentence from the document!")
    
    #delete double occourence of the same word in each sentence
    for i in range(len(summarized_sentences)):
        words = summarized_sentences[i].split()
        prev = ""
        summarized_sentences[i] = ""
        for w in words:
            if w != prev:
                summarized_sentences[i] += (w + " ")
            prev = w
    # eliminate duplicates
    summarized_sentences = list(dict.fromkeys(summarized_sentences))
    summarized_sentences = [s for s in summarized_sentences if len(s) > 20]#delete too short sentences
    return [SalientSentence(s, document.keywords, tastes, document.readability_score, document.score, embedder, 
                config, document_uid=document.uid, position_in_document=index) for index, s in enumerate(summarized_sentences)]

class SalientSentence():
    def __init__(self, sentence, keyword, tastes, readibility, IR_score,  bpemb, config, stopwords = [], document_uid=None, position_in_document=None):
        self.sentence = sentence
        self.readibility = readibility
        self.sentence_rake_embed = self.sentence_rake_embed(stopwords, bpemb)
        if not keyword:
            keyword = tastes
        if keyword:
            self.keyword = {k: bpemb.embed(k) for k in keyword}
            self.distance_keyword = {k: np.mean(distance.cdist(self.keyword[k], self.sentence_embeddings, 'cosine')) for k in keyword}
            # the final score of the sentence associated to each keyword    
            partial_score = config.expertise_weight*readibility + config.IR_score_weight*IR_score    
            self.score = {k: config.affinity_weight*self.distance_keyword[k]+partial_score for k in keyword}
        self.IR_score = IR_score
        # this variable willl be usefull for the policyù
        self.assigned = False
        self.document_uid = document_uid
        self.position_in_document = position_in_document
        
    def sentence_rake_embed(self, stopwords, bpemb):
        # rake
        # embedding
        sentence = rake(self.sentence, stopwords)
        self.sentence_embeddings = np.concatenate([bpemb.embed(s) for s in sentence])
        self.sentence_embeddings_summed = self.sentence_embeddings[0]
        for cur in self.sentence_embeddings[1:]:
            self.sentence_embeddings_summed += cur
