from .user import User

class DocumentModel():
    def __init__(self, result, user):
        '''
        Vars:
            query_keywords = keywords used by query for retrive the result
            url = source of document
            title = title of document (browser tab)
            sections = sections dict of document, equal to json [{title:'', content:''},...]
            plain_text = all text of the article (title, section's title, section's content)
            user = User object of the request [document_adaption.user]
        '''
        self.keywords = []
        self.url = ''
        self.title = ''
        self.sections = []
        self.user = user
        
        if result:
            self.keywords = result['keywords']
            self.url = result['url']
            self.title = result['title']
            self.sections = result['sections']
            self.plain_text = self.get_plain_text(result)
            

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
