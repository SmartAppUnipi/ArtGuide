
class User():
    ''' User interface '''
    def __init__(self, user_profile):
        self.tastes = user_profile['tastes']
        self.expertise_level = int(user_profile['expertiseLevel']) # enum from ["child","novice","knowledgeable","expert"]
        self.language = user_profile['language']