
class User():
    ''' User interface '''
    def __init__(self, user_profile):
        self.tastes = user_profile['tastes'] if 'tastes' in user_profile else []
        self.expertise_level = int(user_profile['expertiseLevel']) if 'expertiseLevel' in user_profile else 1  # enum from ["child","novice","knowledgeable","expert"]
        self.language = user_profile['language'] if 'language' in user_profile else 'en'