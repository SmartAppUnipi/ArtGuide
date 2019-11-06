import io
import os
import json
import requests
import base64

from flask import Flask, escape, request
from google.cloud import vision
from google.cloud.vision import types
from google.protobuf.json_format import MessageToDict
from PIL import Image


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
    return merge_res


# ----- ENVIRONMENT ----- #
app = Flask(__name__)
set_key()
client = vision.ImageAnnotatorClient()


# ----- ROUTES ----- #
@app.route('/upload', methods=['POST'])
def upload():

    '''
    For Test.py:
        load the Base64 encoded image with get_json(),
        decode it back to an image and send it to the API
        to retrieve the JSON answer.
    '''
    #content = json.loads(request.get_json())
    #imgdata = base64.b64decode(content.get('img'))
    #image = Image.frombytes(content.get('mode'), content.get('size'), imgdata)
    #api_res = get_vision(image.tobytes())

    '''
    Otherwise, with flask run (the server started by hand):
        load the image directly and call get_vision.
    '''
    api_res = get_vision(request.files['file'].read())

    # Only visible if run with flask run
    print((json.dumps(api_res)))

    '''
    Call the second server for testing (server2.py):
        first start the server2.py with flask run in a different port
        from app.py (app.py:5000, server2:5001 in this example), then
        call the POST to the server which should return the same JSON.
    '''
    url = 'http://127.0.0.1:5001/upload'

    '''
    Otherwise, use the comment API with the right IP address.
    '''
    # url = 'http://10.101.32.26:3000/'

    # Define the headers (they are needed to make get_json() work)
    headers = {'Content-type': 'application/json'}

    r = requests.post(url, json=(json.dumps(api_res)), headers=headers)

    # Only visible if run with flask run
    print("Risultato: ", r.content)

    return r.content
