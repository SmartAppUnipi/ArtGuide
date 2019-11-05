import io
import os

from flask import Flask, escape, request
from google.cloud import vision
from google.cloud.vision import types


# ----- FUNCTION DEFINITION ----- #
def set_key(key_path='key/vision_api_keys.json'):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path


def get_vision(content):
    # Instantiates a client
    client = vision.ImageAnnotatorClient()

    # The name of the image file to annotate
    image = types.Image(content=content)

    # Performs label detection on the image file
    label = client.label_detection(image=image)
    web_entities = client.web_detection(image=image)
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
    content = request.get_json()
    api_res = get_vision(content['img'])
    print(api_res)
    return 'Success!'