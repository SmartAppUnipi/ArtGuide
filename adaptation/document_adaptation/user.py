class User():
    def __init__(self, user_profile):
        self.tastes = user_profile['tastes']
        self.expertise_level = user_profile['expertiseLevel']
        self.language = user_profile['language']