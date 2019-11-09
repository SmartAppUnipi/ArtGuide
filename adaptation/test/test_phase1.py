import requests
import json
import os
import argparse

parser = argparse.ArgumentParser(
    description=
    '''Use this script ot test the behaviour of Adapatation module to a phase_1 request.
    Remeber to start your flask server:
    1) From adaptation folder run export FLASK_APP=main.py
    2) In the same folder run python2 -m flask run and use your listening address as a parameter'''
)

parser.add_argument('path',
                    metavar='in_path',
                    type=str,
                    help='the relative path to the input file')

parser.add_argument(
    'where_to_deploy',
    metavar='where_to_deploy',
    type=str,
    help=
    "indicates the machine you want the program to run. Use 'your_listening_address' to have it run on your machine, 'cipizio' if you want Matteo's server to run it"
)

args = parser.parse_args()

if (args.where_to_deploy == 'cipizio'):
    URL = "http://cipizio.it:4321"
else:
    URL = args.where_to_deploy

with open(args.path) as file:
    try:
        pars = json.load(file)
    except ValueError:  # includes JSONDecodeError
        logger.error("file is not correct json")
        exit
    r = requests.post(url=URL + "/keywords", json=pars)

data = r.json()

print("The answer to the request contained in {} is".format(args.path))
print(json.dumps(data, indent=2, sort_keys=True))
