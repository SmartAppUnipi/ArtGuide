# PEP8 - 4 spazi
# Attirbuti JSON - camelCase

import os
import sys
from flask import Flask, jsonify, request, abort
import json
from logging.handlers import RotatingFileHandler

from document_adaptation import DocumentsAdaptation, User, semantic_search
from config import config


app = Flask(__name__, static_folder="documentation")
document_adaptation = DocumentsAdaptation(verbose=config.debug)

@app.route('/', methods=["GET","POST"])
def hello():
    api_docs = ""
    with open(config.doc_api_file) as f: 
        api_docs = f.read()
    return api_docs

@app.route('/keywords', methods=["POST"])
def keywords(): 
    req = request.get_json()
    req['keywordExpansion'] = []
    
    # Errors
    if not req:
        return abort(400) # BAD REQUEST
    if 'userProfile' not in req:
        req['adaption_error'] = {"userProfile not found"}
        return jsonify(req)
    if 'tastes' not in req['userProfile']:
        req['adaption_error'] = {"userProfile incomplete"}
        return jsonify(req)
    
    # Body
    user = User(req["userProfile"])
    results = document_adaptation.get_keywords(user.tastes)
    req['keywordExpansion'] = results 
    return jsonify(req)

@app.route('/tailored_text', methods=["POST"])
def tailored_text():
    req = request.get_json()
    req['tailoredText'] = ''

    # Errors
    if not req:
        return abort(400) # BAD REQUEST
    if  'results' not in req:
        req['adaption_error'] = {"results not found"}
        return jsonify(req)
    if 'userProfile' not in req:
        req['adaption_error'] = {"userProfile not found"}
        return jsonify(req)
    if 'tastes' not in req['userProfile'] or 'expertiseLevel' not in req['userProfile'] or 'language' not in req['userProfile']:
        req['adaption_error'] = {"userProfile incomplete"}
        return jsonify(req)
       
    # Body
    user = User(req["userProfile"])
    results = document_adaptation.get_tailored_text(req['results'], user)
    req['tailoredText'] = results
    return jsonify(req)


if __name__ == '__main__':
    app.run(debug=config.debug, host= '0.0.0.0', port=config.port)
    