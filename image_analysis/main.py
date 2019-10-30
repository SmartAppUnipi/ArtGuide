import io
import os

# Imports the Google Cloud client library
from google.cloud import vision
from google.cloud.vision import types

def set_key(key_path='key/vision_api_keys.json'):
  os.environ["GOOGLE_APPLICATION_CREDENTIALS"]=key_path

def get_vision (image_path):
  # Instantiates a client
  client = vision.ImageAnnotatorClient()
  # TODO: merge json reponse
  
  # The name of the image file to annotate
  file_name = os.path.abspath(image_path)
  
  # Loads the image into memory
  with io.open(file_name, 'rb') as image_file:
      content = image_file.read()
  
  image = types.Image(content=content)
  
  # Performs label detection on the image file
  return client.label_detection(image=image)

