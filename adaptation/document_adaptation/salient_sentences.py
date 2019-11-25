import numpy as np
import scipy
from rake_nltk import Rake
from gensim.summarization.summarizer import summarize

def rake(sentence, stopwords):
    # https://pypi.org/project/rake-nltk/
    r = Rake(stopwords=stopwords)
    r.extract_keywords_from_text(sentence)
    raked_sentences = r.get_ranked_phrases()
    return raked_sentences

def from_document_to_salient(document, embedder, ratio=0.3, word_count=None, split=True):
    #https://radimrehurek.com/gensim/summarization/summariser.html
    try:
        summarized_sentences = summarize(document.normalized_text, ratio=ratio, word_count=word_count, split=split)
    except:
        summarized_sentences = []
        print("Error, we were not able to find the salient sentence from the document!")
    return [SalientSentence(s, document.keywords, document.readability_score, embedder) for s in summarized_sentences]

class SalientSentence():
    def __init__(self, sentence, keyword, readibility, bpemb, stopwords = []):
        self.sentence = sentence
        self.readibility = readibility
        self.sentence_rake_embed = self.sentence_rake_embed(stopwords, bpemb)
        self.keyword = {k: bpemb.embed(k) for k in keyword}
        
    def sentence_rake_embed(self, stopwords, bpemb):
        # rake
        # embedding
        sentence = rake(self.sentence, stopwords)
        self.sentence_embeddings = np.concatenate([bpemb.embed(s) for s in sentence])
