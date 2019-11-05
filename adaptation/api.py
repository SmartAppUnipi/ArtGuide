# PEP8 - 4 spazi

from flask import Flask
import json
from document_adaptation import DocumentAdaptation

app = Flask(__name__)

@app.route('/keywords', method="POST")
def keywords():
    req = request.get_json()
    results = DocumentAdaptation.get_keywords(req['user_info'])
    req['keywords'] = results 
    return jsonify(req)

@app.route('/tailored_text', method="POST")
def tailored_text():
    req = request.get_json()
    results = DocumentAdaptation.get_tailored_text(req['texts'])
    req['tailored_text'] = results
    return jsonify(req)


if __name__ == '__main__':
    app.run(debug=True, port=4444)
    