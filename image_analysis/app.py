import io
import os
import json
import requests

from flask import Flask, escape, request
from google.cloud import vision
from google.cloud.vision import types
from google.protobuf.json_format import MessageToDict


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

    merge_res = {
        "label": label,
        "web_entities": web_entities
    }
    return label


# ----- ENVIRONMENT ----- #
app = Flask(__name__)
set_key()
client = vision.ImageAnnotatorClient()


# ----- ROUTES ----- #
@app.route('/upload', methods=['POST'])
def upload():
    #content = request.get_json()
    #api_res = get_vision(content['img'])
    api_res = get_vision(request.files['file'].read())
    print((json.dumps(api_res)))

    url = 'http://10.101.32.26:3000/'
    r = requests.post(url, json=(json.dumps({"puzzi": "davvero"})))
    print(r)

    return r


#10.101.32.26:3000
#POST: (root)