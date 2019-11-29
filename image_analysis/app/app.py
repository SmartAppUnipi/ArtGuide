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

PORT = 2345

# ----- ----- CONFIGURING ROUTES ----- ----- #
if not "ROUTES_JSON" in os.environ:
    print("routes.json path not specified, please set the envir. variable ROUTES_JSON")
    exit(0)
routes_path = os.environ["ROUTES_JSON"]

if not os.path.exists(routes_path):
    print(f"routes file not found: {routes_path}")
    exit(0)

with open(routes_path) as json_path:
    json = json.load(json_path)
    OPUS_URL = json["opus"]
    print(f"> Post to opus service on port {OPUS_URL}")


# ----- CONFIGURING API KEY ----- #
if not "GOOGLE_APPLICATION_CREDENTIALS" in os.environ:
    print("Google cloud vision API key not provided, please set the envir. variable GOOGLE_APPLICATION_CREDENTIALS")
    exit(0)
api_key_path = os.environ["GOOGLE_APPLICATION_CREDENTIALS"]

if not os.path.exists(api_key_path):
    print(f"Google cloud API key file not found: {api_key_path}")


# ----- FUNCTION DEFINITION ----- #
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
CORS(app, resources=r"/*")
client = vision.ImageAnnotatorClient()


# ----- ROUTES ----- #
@app.route("/", methods=["GET"])
def home():
    return "<h1>Image analysis service</h1>"


@app.route("/upload", methods=["POST"])
def upload():
    """
    For Test.py:
        load the Base64 encoded image with get_json(),
        decode it back to an image and send it to the API
        to retrieve the JSON answer.
    """
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

    r = requests.post(OPUS_URL, json=content, headers=head)
    return r.content


if __name__ == "__main__":
    app.config["DEBUG"] = True
    print(f"> Opening service on port {PORT}")
    app.run(host="0.0.0.0", port=PORT)
