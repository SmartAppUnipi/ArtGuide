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
        score1 = textstat.flesch_reading_ease(self.plain_text) #[1-100]
        score2 = textstat.dale_chall_readability_score(self.plain_text) #[1-10]
        score1 = score1 / 100
        score2 = score2 / 10
        score = score1/2 + score2/2
        expertise_level = self.user.expertise_level # dettagli in input_phase2.json
        return score
        pass

        
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

