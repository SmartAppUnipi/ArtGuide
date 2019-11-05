import unittest
import json
import base64

from app import app as tested_app

class TestUpload(unittest.TestCase):

    def test_json(self):
        app = tested_app.test_client()

        with open('sample.jpg', 'rb') as file:
            data = base64.b64encode(file.read())
        reply = app.post('/upload', json.dumps({'img': data.decode('UTF-8')}))

        self.assertEqual(reply.status_code, 200)
