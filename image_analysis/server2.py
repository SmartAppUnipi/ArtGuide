import io
import os
import json
import requests

from flask import Flask, escape, request


# ----- ENVIRONMENT ----- #
app = Flask(__name__)


# ----- ROUTES ----- #
@app.route('/upload', methods=['POST'])
def upload():

    '''
    This server is just for testing: it takes a POST from app.py with
    some JSON data and send it back the same thing.
    '''

    print("Received the following JSON request:")
    print(request.get_data())
    print("Returning.")

    return request.get_data()
