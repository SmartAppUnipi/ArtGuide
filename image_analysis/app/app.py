import io
import re
import os
import json
import requests
import base64
import pprint

from flask_cors import CORS
from flask import Flask, escape, request
from google.cloud import vision
from google.cloud.vision import types
from google.protobuf.json_format import MessageToDict
from PIL import Image


# URL = 'http://srv.ald.ooo:3000/'
URL = "http://10.101.24.97:3000/"


# ----- FUNCTION DEFINITION ----- #
def set_key(key_path='key/vision_api_keys.json'):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path


def get_vision(content):
    # Instantiates a client
    client = vision.ImageAnnotatorClient()

    # The name of the image file to annotate
    image = types.Image(content=content)

    # Performs label detection on the image file
    label = MessageToDict(client.label_detection(image=image))
    web_entities = MessageToDict(client.web_detection(image=image))

    return {"label": label, "we": web_entities}


# ----- ENVIRONMENT ----- #
app = Flask(__name__)
CORS(app, resources=r'/*')
set_key()
client = vision.ImageAnnotatorClient()


# ----- ROUTES ----- #
@app.route('/', methods=['GET'])
def home():
    return '<h1>hello</h1>'


@app.route('/upload', methods=['POST'])
def upload():
    '''
    For Test.py:
        load the Base64 encoded image with get_json(),
        decode it back to an image and send it to the API
        to retrieve the JSON answer.
    '''
    content = request.get_json()
    image = content["image"]
    image_b64_str = re.sub("^data:image/.+;base64,", "", image)
    img_b64 = base64.b64decode(image_b64_str)
    api_res = get_vision(img_b64)

    # Define the headers (they are needed to make get_json() work)
    head = {"Content-type": "application/json"}

    content["classification"] = {
        "labels": api_res["label"]["labelAnnotations"],
        "entities": api_res["we"]["webDetection"]["webEntities"],
        "locations": [],
        "safeSearch": [],
        "type": [],
        "monumentType": [],
        "period": [],
        "style": [],
        "materials": []
    }
    del content["image"]
    pprint.pprint(content)

    r = requests.post(URL, json=content, headers=head)
    return r.content


if __name__ == '__main__':
    app.config['DEBUG'] = True
    app.run(host='0.0.0.0', port=8080)