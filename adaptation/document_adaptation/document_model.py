"""
    document_model.py: class 
        * tastes: list of uTastes
        * expertise_level: interger from 1 to 4 (1 = 'child', ...)
        * language: abbreviation for the languages (e.g. "en")
        * tastes_embedded: dictionary of embeddings of tastes
    ArtGuide project SmartApp1920
    Dipartimento di Informatica Università di Pisa
    Authors: M. Barato, S. Berti, M. Bonsembiante, P. Lonardi, G. Martini
    We declare that the content of this file is entirelly
    developed by the authors
"""

import re
import spacy
import os
from .user import User
from rake_nltk import Rake
from gensim.summarization.summarizer import summarize
import html


class DocumentModel():
    """
        Class representing a document, containing the following fields:
        * query_keywords: keywords used by IR in the query which led to the retrieval of that result
        * url: source of document
        * title: title of document (browser tab)
        * sections = sections dict of documents, equal to json [{title:'', content:''},...]
        * user = User object of the request [document_adaption.user]
        * plain_text = plain_text without markup tags or noisy simbols
        * normalized_text = plain text after normalization step
        * stop_words = the stop words for the text
        * readability_score = value for the readability of such text
        * nlp = spacy dictionary for readability evaluation 
        * score = the score given by SDAIS module to the document
    """
    def __init__(self, result, user, nlp, stop_words=[], uid=None):
        self.keywords = []
        self.url = ''
        self.title = ''
        self.sections = []
        self.user = user
        self.plain_text = ''
        self.normalized_text = ''
        self.stop_words = stop_words
        self.readability_score = 0
        self.affinity_score = 0
        self.nlp = nlp
        self.score = 0
        self.uid = uid

        if result:
            self.keywords = result['keywords']
            self.url = result['url']
            self.title = result['title']
            self.sections = result['sections']
            if 'score' in result:
                self.score = result['score']
            self.plain_text = self.get_plain_text(result)
            self.normalized_text = self.normalize(self.plain_text)

    def get_plain_text(self, result):
        """ 
        Function for converting result in plain text.
        @param result: doctionary given from SDAIS step
        
        @return plain text containing title, section's title, sections'content, \n separated
        """
        plain_text = result['title'] + '.\n'
        if len(result['sections']):
            for section in result['sections']:
                plain_text += section[
                    'title'] + '.\n' if 'title' in section else ''
                plain_text += section['content'] if 'content' in section else ''
        return plain_text

    def normalize(self, text):
        """Function of cleaning text from JS and HTML tags"""
        text = re.sub('<pre>.*?</pre>', '', text, flags=re.DOTALL)
        text = re.sub('<code>.*?</code>', '', text, flags=re.DOTALL)
        text = re.sub('<[^>]+>©', '', text, flags=re.DOTALL)
        text = re.sub('(?<=[.,])(?![0-9])', ' ', text, flags=re.DOTALL)
        text = re.sub('\[.*?\]', '', text, flags=re.DOTALL)
        text = re.sub('\[.*?\]', '-', text, flags=re.DOTALL)
        text = ' '.join(text.splitlines())
        return text

    def user_readability_score(self):
        """ 
        This function computes the readability score based on the user expertise level.
        Description.....  
        Returns:
            Float value between 0 (easy to read) and 1 (difficult to read). 
        """
        doc = self.nlp(self.plain_text)

        docscore = doc._.flesch_kincaid_reading_ease
        docscore = docscore / 100
        if docscore > 1 or docscore < 0:
            return 0
        level = self.user.expertise_level
        expertise_level = level / 4  # dettagli in input_phase2.json
        score = 1 - abs(expertise_level-docscore)
        self.readability_score = score
        return score  #  [0-1] contando utente

    def rake(self, n_sentences=10):
        """
        Function for extracting "n_sentences" salient sentences from text
        """
        # https://pypi.org/project/rake-nltk/
        r = Rake(stopwords=self.stop_words)
        r.extract_keywords_from_text(self.normalized_text)
        salient_sentences = r.get_ranked_phrases()
        return salient_sentences[:n_sentences]

    def textRank(self, ratio=0.3, word_count=None, split=True):
        """
        Function for summarizing normalized text
        @param ratio
        @param word_count
        @param split

        @return list of summarized sentences
        """
        # https://radimrehurek.com/gensim/summarization/summariser.html
        try:
            summarized_sentences = summarize(self.normalized_text,
                                             ratio=ratio,
                                             word_count=word_count,
                                             split=split)
        except:
            summarized_sentences = []
        return summarized_sentences

    def salient_sentences(self):
        """ This function provides the list of most representative sentences of parts of text, combining the results of RAKE algorithm and TextRank summarization algorithm

        @return list of strings
        """
        # we try to use only sentence from summarization!
        #self.rake_sentences = self.rake()
        self.summarized_sentences = self.textRank()
        return self.summarized_sentences

    def affinity_score_single_sentence(self, results, readibility):
        """
        This function returns a list of couples: <sentence, [(score, keyword)]>
        @param results: dictionary of triplets <dist(keyword, sentence), sentence, embedding>
        @param readability: float representing the readability coefficient of the whole text (union of elements of results)

        @return [<sentence, [(score, keyword, embedding_of_sent)]>]
        """
        sentences = []
        not_completed = 1
        for keyword in results.values():
            for i in range(len(keyword)):
                if not_completed:
                    # keyword[i][1] is the sentence, readibility is the readibility  score
                    # keyword[i][0] is the distance between the sentence embedding and the keyword
                    sentences.append([
                        keyword[i][1], readibility, [keyword[i][0]],
                        keyword[i][2]
                    ])
                else:
                    sentences[i][2] += [keyword[i][0]]
            not_completed = 0
        return sentences

    def topics_affinity_score(self, results):
        """
        This function computes the affinity between the document and the user's tastes.

        @param results: list of results

        @return float value between 0 (no inherent tastes detected) and 1 (tastes's inherent). 
        """
        self.affinity_score = 0
        for taste in self.user.tastes:
            if taste in results:
                affinity = sum([res[0] for res in results[taste]])
                if affinity > 0:
                    self.affinity_score = affinity / len(results[taste])
        return self.affinity_score

    # def affinity_score(self):
    #     """
    #     Calculate and return the final score of document affinity
    #     taking into consideration on user's preferences.

    #     Returns:
    #         Float value between 0 (not affine) and 1 (affine).
    #     """
    #     return (self.user_readability_score() + self.topics_affinity_score())/2
