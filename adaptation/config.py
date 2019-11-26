import json

class Struct:
    def __init__(self, **entries):
        self.__dict__.update(entries)

config_path = './config.json'
config = Struct(**{})

with open(config_path) as json_file:
    args = json.load(json_file)
    config = Struct(**args)
    

