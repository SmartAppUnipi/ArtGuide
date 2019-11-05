# PEP8 - 4 spazi

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
        POST /keywords REQ:{"u_tastes": ["history", "description", "legacy"]} RES:{"keyword_expansion": {"history":"kh", "description":"kd", "legacy":"kl"]}
        POST /tailored_text REQ:{"u_tastes": ["history", "description", "legacy"]} RES:{"keyword_expansion": {"history":"kh", "description":"kd", "legacy":"kl"]}
    '''
    return 

@app.route('/keywords', methods=["POST"])
def keywords():
    req = request.get_json()
    if not req or 'u_tastes' not in req:
        return jsonify({"error":"Input not found"})
    print(req)
    results = document_adaption.get_keywords(req['u_tastes'])
    req['keyword_expansion'] = results 
    return jsonify(req)

@app.route('/tailored_text', methods=["POST"])
def tailored_text():
    req = request.get_json()
    if not req or 'results' not in req:
        return jsonify({"error":"Input not found"})

    results = document_adaption.get_tailored_text(req['results'])
    req['tailored_text'] = results
    return jsonify(req)


if __name__ == '__main__':
    app.run(debug=True, host= '0.0.0.0', port=4444)
    