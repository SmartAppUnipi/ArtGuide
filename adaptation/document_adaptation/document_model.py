class DocumentModel():
    def __init__(self, result=None):
        self.keywords = []
        self.url = ''
        self.title = ''
        self.sections = []
        self.plain_text = ''

        if result:
            self.keywords = result['keywords']
            self.url = result['url']
            self.title = result['title']
            self.sections = result['sections']
            self.plain_text = self.get_plain_text(result)
            

    def get_plain_text(self, result):
        ''' Convert result in plain text'''
        plain_text = result['title']+'\n'
        if len(result['sections']):
            for section in result['sections']:
                plain_text += section['title']+'\n'
                plain_text += section['content']
        return plain_text