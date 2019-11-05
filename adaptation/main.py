# PEP8 - 4 spazi
# Attirbuti JSON - camelCase

import os
import sys
from flask import Flask, jsonify, request
import json
from logging.handlers import RotatingFileHandler

from document_adaptation import DocumentAdaptation
from config import config


app = Flask(__name__, static_folder="documentation")
document_adaptation = DocumentAdaptation()

@app.route('/', methods=["GET","POST"])
def hello():
    api_docs = ""
    with open(config.doc_api_file) as f: 
        api_docs = f.read()
    return api_docs

@app.route('/keywords', methods=["POST"])
def keywords(): 
    req = request.get_json()
    if not req or 'uTastes' not in req:
        return jsonify({"error":"Input not found"})
    print(req)
    results = document_adaptation.get_keywords(req['uTastes'])
    req['keywordExpansion'] = results 
    return jsonify(req)

@app.route('/tailored_text', methods=["POST"])
def tailored_text():
    req = request.get_json()
    if not req or 'results' not in req:
        return jsonify({"error":"Input not found"})

    results = document_adaptation.get_tailored_text(req['results'])
    req['tailoredText'] = results
    return jsonify(req)


if __name__ == '__main__':
    app.run(debug=config.debug, host= '0.0.0.0', port=config.port)
    