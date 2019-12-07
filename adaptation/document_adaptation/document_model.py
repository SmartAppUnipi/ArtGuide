import re
import spacy
import os
from .user import User
from rake_nltk import Rake
from gensim.summarization.summarizer import summarize

class DocumentModel():
    def __init__(self, result, user, nlp, stop_words=[]):
        '''
        Vars:
            query_keywords = keywords used by query for retrive the result
            url = source of document
            title = title of document (browser tab)
            sections = sections dict of document, equal to json [{title:'', content:''},...]
            plain_text = all text of the article (title, section's title, section's content)
            plain_text = plain_text without markup tags or noisy simbols
            user = User object of the request [document_adaption.user]
        '''
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
        ''' 
        Convert result in plain text.

        Args:
            result: Dict given from SDAIS step
        Returns:
            Plain text containing title, section's title, sections'content, \n separated
        '''
        plain_text = result['title']+'.\n'
        if len(result['sections']):
            for section in result['sections']:
                plain_text += section['title']+'.\n' if 'title' in section else ''
                plain_text += section['content'] if 'content' in section else ''
        return plain_text

    def normalize(self, text):
        tm1 = re.sub('<pre>.*?</pre>', '', text, flags=re.DOTALL)
        tm2 = re.sub('<code>.*?</code>', '', tm1, flags=re.DOTALL)
        tm3 = re.sub('<[^>]+>©', '', tm1, flags=re.DOTALL)
        return tm3.replace("\n", "")

    def user_readability_score(self):
        ''' 
        Calculate the readability score based on the user expertise level.
        Description.....  
        Returns:
            Float value between 0 (easy to read) and 1 (difficult to read). 
        '''
        doc = self.nlp(self.plain_text)

        score = doc._.coleman_liau_index
        score = score / 90
        if score > 1 or score < 0:
            return 0
        level = self.user.expertise_level
        expertise_level = level / 4  # dettagli in input_phase2.json
        self.readability_score = score
        return score #  [0-1] senza contare utente

    def rake(self, n_sentences=10):
        # https://pypi.org/project/rake-nltk/
        r = Rake(stopwords=self.stop_words)
        r.extract_keywords_from_text(self.normalized_text)
        salient_sentences = r.get_ranked_phrases()
        return salient_sentences[:n_sentences]

    def textRank(self, ratio=0.3, word_count=None, split=True):
        # https://radimrehurek.com/gensim/summarization/summariser.html
        try:
            summarized_sentences = summarize(self.normalized_text, ratio=ratio, word_count=word_count, split=split)
        except:
            summarized_sentences = []
        return summarized_sentences

    def salient_sentences(self):
        ''' List of most rappresentative sentences of parts of there, combaining the 
        results of RAKE algorithm and TextRank summarization algorithm

        Returns:
            List of strings
        '''
        # we try to use only sentence from summarization!
        #self.rake_sentences = self.rake()
        self.summarized_sentences = self.textRank()
        return self.summarized_sentences

    def affinity_score_single_sentence(self, results, readibility):
        '''
        Given the results of semantic search {"keyword":[[score, sentence, embeddin]]}
        This function returns a list of the sentences with the score for each keyword and the embedding
        ["sentence", ]
        '''
        sentences = []
        not_completed = 1
        for keyword in results.values():
            for i in range(len(keyword)):
                if not_completed:
                    # keyword[i][1] is the sentence, readibility is the readibility  score 
                    # keyword[i][0] is the distance between the sentence embedding and the keyword
                    sentences.append([keyword[i][1], readibility, [keyword[i][0]], keyword[i][2]])
                else:
                    sentences[i][2] += [keyword[i][0]]
            not_completed = 0
        return sentences

    def topics_affinity_score(self, results):
      
        '''
        Calculate and return the document affinity scores based on user's tastes.
        
        Returns:
            Float value between 0 (not tastes's inherent) and 1 (tastes's inherent). 
        '''
        self.affinity_score = 0
        for taste in self.user.tastes: 
            if taste in results:
                affinity = sum([res[0] for res in results[taste]]) 
                if affinity > 0:
                    self.affinity_score = affinity / len(results[taste])
        return self.affinity_score

    # def affinity_score(self):
    #     '''
    #     Calculate and return the final score of document affinity 
    #     taking into consideration on user's preferences.

    #     Returns:
    #         Float value between 0 (not affine) and 1 (affine). 
    #     '''
    #     return (self.user_readability_score() + self.topics_affinity_score())/2