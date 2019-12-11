"""
    user.py: class for defining a user, that has the following fields
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


class User():
    ''' User interface '''
    def __init__(self, user_profile):
        """
        Instantiation of class User
        @param user_profile: dictionary of tastes, expLevel and lang
        """
        self.tastes = []
        self.expertise_level = 1  # enum from ["child","novice","knowledgeable","expert"]
        self.language = 'en'
        self.tastes_embedded = {}
        if 'tastes' in user_profile:
            self.tastes = user_profile['tastes']
        if 'expertiseLevel' in user_profile:
            self.expertise_level = int(user_profile['expertiseLevel'])
        if 'language' in user_profile:
            self.language = user_profile['language']

    def embed_tastes(self, embedder):
        """
        Function for assigning "tastes_embedded" field in User class
        @param embedder: object for mapping words into embeddings
        """
        if self.tastes:
            for taste in self.tastes:
                self.tastes_embedded[taste] = embedder.embed(taste)
        print(self.tastes_embedded)
