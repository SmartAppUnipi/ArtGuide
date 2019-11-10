from abc import ABC, abstractmethod 
from sentence_transformers import SentenceTransformer
import numpy as np
import scipy

class Distance(ABC):
    @abstractmethod
    def distance(self, sentence, keyword):
        pass
    
    @abstractmethod
    def multiple_distances(self, sentence, list_keywords):
        pass

class Semantic_Search():
    # class that, given some sentences and some keyword rank the senctances 
    # from the most significant to the less significant in respect to the keyword
    def __init__(self, Dist, K = 4):
        # distance is a class derived by the class Distance. It have to implement the methond:
        #  multiple_distances() and distance()
        self.Dist = Dist
        self.K = 4
    
    def find_most_similar_multiple_keywords(self, list_sentences, list_keywords, k = None, verbose = True):
        # given a list of keywords it returns the most similar sentence for each keyword!
        # this method is usefull in order to compute the embedding of the sentece only once
        k = k if k else self.K
        result = { i : [] for i in list_keywords }
        for sentence in list_sentences:
            dist = self.Dist.multiple_distances(sentence, list_keywords)
            for i, d in enumerate(dist):
                result[list_keywords[i]].append((d, sentence))
        for key in list_keywords:
            result[key].sort()
            if verbose:
                self.show_list(result[key], key)
        return result

    def show_list(self, list, keyword):
        print("The keyword is "+ keyword)
        for l in list:
            print(l[1]+str(l[0]))
        

    def find_most_similar_one_keyword(self, list_sentences, keyword, k = None, verbose = True):
        # function that given a list of sentences and a keyword 
        # returns a list which contains the most similar keyword. 
        k = k if k else self.K
        ranked_sentences = []
        for sentence in list_sentences:
            dist =  self.Dist.distance(sentence, keyword)
            ranked_sentences.append((dist, sentence))
        ranked_sentences.sort()
        if verbose:
            self.show_list(ranked_sentences, keyword)
        return ranked_sentences[len(ranked_sentences)- min(k, len(ranked_sentences)):]
    

class BERT_distance(Distance):
    def __init__(self, distance_metric = "cosine"):
        # define the metrics. Could be cosine distance or euclidian distance
        # we can use the metric from 
        # https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.distance.cdist.html
        self.distance_metric = distance_metric
        self.embedder = SentenceTransformer('bert-base-nli-mean-tokens')

    def multiple_distances(self, sentence, list_keywords):
        # given a set of keyword it returns the distance betwen the sentence and each keyword.
        # this method is usefull in order to compute the embedding of the sentece only once
        sentence_embeddings = self.embedder.encode([sentence])
        list_keyword_embeddings = self.embedder.encode(list_keywords)
        distances = scipy.spatial.distance.cdist(list_keyword_embeddings, sentence_embeddings, self.distance_metric)
        distances = [d[0] for d in distances]
        return distances


    def distance(self, sentence, keyword):
        sentence_embeddings = self.embedder.encode([sentence])
        keyword_embeddings = self.embedder.encode([keyword])
        distance = scipy.spatial.distance.cdist(sentence_embeddings, keyword_embeddings, self.distance_metric)[0][0]
        return distance