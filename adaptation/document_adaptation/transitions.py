"""
    transitions: classes for dealing with transitions
        among paragraphs
    SmartApp 2019-2020 Project
    Dipartimento di Informatica Università di Pisa
    Authors: M. Barato, S. Berti, M. Bonsembiante,
        P. Lonardi, G. Martini
    We declare that the content of this file is entirelly
    developed by the authors
"""

import random
import json
import os

class transitions_handler(object):
    def __init__(self, data_path):
        self.data_path = data_path
        pass

    def extract_transition(self, lang="eng", topic=None, t1=None, t2=None):
        """
        Assumption: if t1 is None also t2 is None
        """
        if (lang != "en") and (lang != "it"):
            raise Exception("LangNotImplementedException")
        with open(os.path.join(self.data_path, "transitions_" + lang + ".json")) as json_file:
            data = json.load(json_file)
            transitions = None
            if topic and topic in data["man"]:
                transitions = data["man"][topic]
            else:
                if topic and topic not in data["man"]:
                    t1 = topic

                if not t1:  #No parameters
                    transitions = data["auto"]["zero_par"]
                else:
                    if not t2:
                        transitions = [x.format(t1) for x in data["auto"]["one_par"]]
                    else:
                        transitions = [x.format(t1, t2) for x in data["auto"]["two_par"]]
            
            if not transitions:
                raise Exception("WrongTasteException")
            return random.choice(transitions)
