import unittest
import pytest
import json
import base64

from io import BytesIO
from app import app as tested_app
from PIL import Image


class TestUpload(unittest.TestCase):

    def test_json(self):
        app = tested_app.test_client()

        # Open the image and convert it to Base64 encoding to place
        # it in a JSON file
        with Image.open('resources/images_test.jpg', 'r') as img:
            sizes = img.size
            mode = img.mode

            # Encode the image from a byte buffer to data
            buffer = BytesIO()
            img.save(buffer, "PNG")
            data = base64.b64encode(buffer.getvalue())

        # Define the headers (they are needed to make get_json() work)
        headers = {'Content-type': 'application/json'}

        # Send the POST to the server with the image formatted as a
        # Base64 in a JSON file with they key = 'img'
        reply = app.post('/upload', json=json.dumps({'img': str(data, 'ASCII'), 'size': sizes, 'mode': mode}), headers=headers)

        self.assertEqual(reply.status_code, 200)
        print(reply.content)
