import io
import re
import os
import json
import requests
import base64
import pprint

from helpers import Point, ImageBoundingBox
from flask_cors import CORS
from flask import Flask, escape, request
from google.cloud import vision
from google.cloud.vision import types
from google.protobuf.json_format import MessageToDict
from PIL import Image
from dotenv import load_dotenv
# from ..classification.codebase import CROP_SIZE


load_dotenv()
PORT = 2345
VALID_LABELS = {"Painting", "Picture frame"}
CROP_SIZE = [300, 300, 3]

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
    # The name of the image file to annotate
    image = types.Image(content=content)

    # Performs label detection on the image file
    label = MessageToDict(client.label_detection(image=image))
    web_entities = MessageToDict(client.web_detection(image=image))
    objects = MessageToDict(client.object_localization(image=image))

    return {"label": label, "we": web_entities, "objects": objects}


def get_bounding(content):
    #client = vision.ImageAnnotatorClient()

    # The name of the image file to annotate
    image = types.Image(content=content)

    # Performs object detection on the image file
    objects = MessageToDict(client.object_localization(image=image))

    return objects

def freebaseID2wd(freebase_id):
    url = 'https://query.wikidata.org/sparql'
    query = f"""
    PREFIX wd: <http://www.wikidata.org/entity/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX wikibase: <http://wikiba.se/ontology#>

    SELECT ?s WHERE {{
      ?s ?p ?o .
      ?s wdt:P646 "/m/0cn46" .
    }}
    LIMIT 1
    """
    r = requests.get(url, params = {'format': 'json', 'query': query})
    data = r.json()
    iri = data["results"]["bindings"][0]["s"]["value"]    
    return iri.split("/")[-1]

# ----- CROP FUNCTION ON BOUNDING BOX ----- #
def crop_on_bb(image, api_res):
    most_centered_obj = None
    for obj in api_res["objects"]["localizedObjectAnnotations"]:
        print(obj["name"])
        if obj["name"] in VALID_LABELS:

            # Sum distances from the center (return the most "centered" bounding box)
            nv = obj["boundingPoly"]["normalizedVertices"]
            bb = ImageBoundingBox(nv)

            if (most_centered_obj is None) or (bb.distance < most_centered_obj.distance):
                most_centered_obj = bb

    if most_centered_obj is None:
        print(" -- No crop found -- ")
        return image


    imageb = Image.open(io.BytesIO(image))
    imageb.show()
    width, height = imageb.size

    points = most_centered_obj.points

    left = points[0].x * width 
    top = points[0].y * height
    right = points[1].x * width
    bottom = points[2].y * height

    # Cropped image of above dimension  
    # (It will not change orginal image)  
    im1 = imageb.crop((left, top, right, bottom)) 
    newsize = (CROP_SIZE[0], CROP_SIZE[1])
    im1 = im1.resize(newsize) 
    # Shows the image in image viewer  
    im1.show()

    print(most_centered_obj)

    return image


# ----- ENVIRONMENT ----- #
app = Flask(__name__)
CORS(app, resources=r"/*")
client = vision.ImageAnnotatorClient()


# ----- ROUTES ----- #
@app.route("/", methods=["GET"])
def home():
    return "<h1>Image analysis service</h1>"


@app.route("/mock", methods=["POST"])
def mock():
    content = request.get_json()
    labels = image_analysis(content)
    return str(labels)


@app.route("/upload", methods=["POST"])
def upload():
    # Define the headers (they are needed to make get_json() work)
    head = {"Content-type": "application/json"}

    content = request.get_json()
    labels = image_analysis(content)

    r = requests.post(OPUS_URL, json=labels, headers=head)
    return r.content


def image_analysis(content):
    """
    For Test.py:
        load the Base64 encoded image with get_json(),
        decode it back to an image and send it to the API
        to retrieve the JSON answer.
    """
    image = content["image"]
    image_b64_str = re.sub("^data:image/.+;base64,", "", image)
    img_b64 = base64.b64decode(image_b64_str)
    api_res = get_vision(img_b64)

    cropped_img = crop_on_bb(img_b64, api_res)

    content["classification"] = {
        "labels": api_res["label"]["labelAnnotations"],
        "entities": api_res["we"]["webDetection"]["webEntities"],
        "objects": api_res["objects"],
        "locations": [],
        "safeSearch": [],
        "type": [],
        "monumentType": [],
        "period": [],
        "style": [],
        "materials": []
    }
    del content["image"]
    # pprint.pprint(content)

    return content

if __name__ == "__main__":
    app.config["DEBUG"] = True
    print(f"> Opening service on port {PORT}")
    app.run(host="0.0.0.0", port=PORT)
