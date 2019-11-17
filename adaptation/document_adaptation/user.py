
class User():
    ''' User interface '''
    def __init__(self, user_profile):
        self.tastes = []
        self.expertise_level = 1  # enum from ["child","novice","knowledgeable","expert"]
        self.language = 'en'

        if 'tastes' in user_profile:
            self.tastes = user_profile['tastes'] 
        if 'expertiseLevel' in user_profile:
            self.expertise_level = int(user_profile['expertiseLevel']) 
        if 'language' in user_profile:
            self.language = user_profile['language'] 