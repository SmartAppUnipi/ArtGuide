import re
from .user import User
from rake_nltk import Rake
from gensim.summarization.summarizer import summarize

class DocumentModel():
    def __init__(self, result, user, stop_words=[]):
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
        
        if result:
            self.keywords = result['keywords']
            self.url = result['url']
            self.title = result['title']
            self.sections = result['sections']
            self.plain_text = self.get_plain_text(result)
            self.normalized_text = self.normalized(self.plain_text)
            

    def get_plain_text(self, result):
        ''' 
        Convert result in plain text.

        Args:
            result: Dict given from SDAIS step
        Returns:
            Plain text containing title, section's title, sections'content, \n separated
        '''
        plain_text = result['title']+'\n'
        if len(result['sections']):
            for section in result['sections']:
                plain_text += section['title']+'\n'
                plain_text += section['content']
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
        import textstat
        import os

        for filename in os.listdir("../demo/dataset"):
            if filename.endswith(".txt"):
                score = textstat.flesch_reading_ease(open(os.path.join('../demo/dataset', filename),
                                                          encoding="utf8").read())  # [1-100] alto facile, basso difficile
                score = score / 100
                if score > 1 or score < 0:
                    continue
                print(filename)
                print(score)
                level = 1
                expertise_level = level / 3  # dettagli in input_phase2.json
                print(expertise_level)
                print(abs(expertise_level - score))
                return abs(expertise_level - score)

    def rake(self, n_sentences=10):
        # https://pypi.org/project/rake-nltk/
        r = Rake(stopwords=self.stop_words)
        r.extract_keywords_from_text(self.normalized_text)
        salient_sentences = r.get_ranked_phrases()
        return salient_sentences[:n_sentences]

    def textRank(self, ratio=0.3, word_count=None, split=True):
        # https://radimrehurek.com/gensim/summarization/summariser.html
        summarized_sentences = summarize(self.normalized_text, ratio=ratio, word_count=word_count, split=split)
        return summarized_sentences

    def salient_sentences(self):
        ''' List of most rappresentative sentences of parts of there, combaining the 
        results of RAKE algorithm and TextRank summarization algorithm

        Returns:
            List of strings
        '''
        salient_sentences = []
        salient_sentences += self.rake()
        salient_sentences += self.textRank()
        return salient_sentences

    def topics_affinity_score(self):
      
        '''
        Calculate and return the document affinity scores based on user's tastes.
        
        Returns:
            Float value between 0 (not tastes's inherent) and 1 (tastes's inherent). 
        '''
        return 1

    def affinity_score(self):
        '''
        Calculate and return the final score of document affinity 
        taking into consideration on user's preferences.

        Returns:
            Float value between 0 (not affine) and 1 (affine). 
        '''
        return (self.user_readability_score() + self.topics_affinity_score())/2
