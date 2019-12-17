"""
    config.py: configuration file
    ArtGuide project SmartApp1920
    Dipartimento di Informatica Università di Pisa
    Authors: M. Barato, S. Berti, M. Bonsembiante, P. Lonardi, G. Martini
    We declare that the content of this file is entirelly
    developed by the authors
"""

import json

class Struct:
    def __init__(self, **entries):
        self.__dict__.update(entries)

config_path = './config.json'
config = Struct(**{})

try:
    with open(config_path) as json_file:
        args = json.load(json_file)
        config = Struct(**args)
except:
    config_path = 'adaptation/config.json'
    with open(config_path) as json_file:
        args = json.load(json_file)
        config = Struct(**args)

