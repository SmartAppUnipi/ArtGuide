from abc import ABC, abstractmethod 
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
    def __init__(self, Dist):
        # distance is a class derived by the class Distance. It have to implement the methond:
        #  multiple_distances() and distance()
        self.Dist = Dist
    
    def find_most_similar_multiple_keywords(self, list_sentences, list_keywords, verbose = True):
        # given a list of keywords it returns the most similar sentence for each keyword!
        # this method is usefull in order to compute the embedding of the sentece only once
        result = { i : [] for i in list_keywords }
        for sentence in list_sentences:
            dist = self.Dist.multiple_distances(sentence, list_keywords)
            for i, d in enumerate(dist):
                result[list_keywords[i]].append((d, sentence))
        for key in list_keywords:
            if verbose:
                self.show_list(result[key], key)
        return result

    def show_list(self, list, keyword):
        print("The keyword is "+ keyword)
        for l in list:
            print(l[1]+str(l[0]))
        

    def find_most_similar_one_keyword(self, list_sentences, keyword, verbose = True):
        # function that given a list of sentences and a keyword 
        # returns a list of the sentences which are more similar to the keyword
        ranked_sentences = []
        for sentence in list_sentences:
            dist =  self.Dist.distance(sentence, keyword)
            ranked_sentences.append((dist, sentence))
        if verbose:
            self.show_list(ranked_sentences, keyword)
        return ranked_sentences
    

class BERT_distance(Distance):
    def __init__(self, distance_metric = "cosine"):
        from sentence_transformers import SentenceTransformer

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

class BPEmb_Embedding_distance(Distance):
    # when we init ourn object we have to decide the dimention of vocab size(VS), dimention of the space 
    # dim and the language.
    # For more info https://github.com/bheinzerling/bpemb
    def __init__(self, lang = "en", dim = 200, vs = 200000, distance_metric = "cosine"):
        from bpemb import BPEmb
        self.bpemb = BPEmb(lang=lang, dim=dim, vs = vs)
        self.distance_metric = distance_metric

    def distance(self, sentence, keyword):
        sentence_embeddings = self.bpemb.embed(sentence)
        keyword_embeddings = self.bpemb.embed(keyword)
        # find the distance between them. Again euclidian distance now
        distance = scipy.spatial.distance.cdist(sentence_embeddings, keyword_embeddings, self.distance_metric)
        return distance.mean()

    def multiple_distances(self, sentence, list_keywords):
        sentence_embeddings = self.bpemb.embed(sentence)
        result = []
        for keyword in list_keywords:
            keyword_embeddings = self.bpemb.embed(keyword)
            distance = scipy.spatial.distance.cdist(sentence_embeddings, keyword_embeddings, self.distance_metric)
            result.append(distance.mean())
        return result


