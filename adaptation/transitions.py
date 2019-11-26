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


class transitions_handler(object):
    def __init__(self):
        pass

    def extract_transition(self, lang="eng", topic=None, t1=None, t2=None):
        """
        Assumption: if t1 is None also t2 is None
        """
        if (lang != "eng") and (lang != "ita"):
            raise Exception("LangNotImplementedException")
        with open("data/transitions_" + lang + ".json") as json_file:
            data = json.load(json_file)
            transitions = None
            if topic:
                transitions = data["man"][topic]
            else:
                if not t1:  #No parameters
                    transitions = data["auto"]["zero_par"]
                else:
                    if not t2:
                        transitions = data["auto"]["one_par"].format(t1)
                    else:
                        transitions = data["auto"]["two_par"].format(t1, t2)

            if not transitions:
                raise Exception("WrongTasteException")
            return random.choice(transitions)
