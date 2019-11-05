# PEP8 - 4 spazi
# Attirbuti JSON - camelCase

import os
import sys
from flask import Flask, jsonify, request
import json
sys.path.append(os.path.abspath('../'))

from document_adaptation import DocumentAdaptation

app = Flask(__name__)
document_adaption = DocumentAdaptation()

@app.route('/', methods=["GET","POST"])
def hello():
    documentation = '''
        <b>POST /keywords</b> <br/>REQ:{"uTastes": ["history", "description", "legacy"]} RES:{"keywordExpansion": {"history":"kh", "description":"kd", "legacy":"kl"]}<br/>
        <b>POST /tailored_text</b> </br>REQ:{"results": ....]} RES:{"tailoredText": "Stringa con testo dell'articolo"]}
    '''
    return documentation

@app.route('/keywords', methods=["POST"])
def keywords():
    req = request.get_json()
    if not req or 'uTastes' not in req:
        return jsonify({"error":"Input not found"})
    print(req)
    results = document_adaption.get_keywords(req['uTastes'])
    req['keywordExpansion'] = results 
    return jsonify(req)

@app.route('/tailored_text', methods=["POST"])
def tailored_text():
    req = request.get_json()
    if not req or 'results' not in req:
        return jsonify({"error":"Input not found"})

    results = document_adaption.get_tailored_text(req['results'])
    req['tailoredText'] = results
    return jsonify(req)


if __name__ == '__main__':
    app.run(debug=True, host= '0.0.0.0', port=4321)
    