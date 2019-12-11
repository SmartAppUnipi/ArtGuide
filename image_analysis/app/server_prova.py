import io
import os
import json
import requests

from flask import Flask, escape, request


# ----- ENVIRONMENT ----- #
app = Flask(__name__)
PORT = 5000


# ----- ROUTES ----- #
@app.route('/', methods=['POST'])
def upload():
    '''
    This server is just for testing: it takes a POST from app.py with
    some JSON data and send it back the same thing.
    '''

    print("Received the following JSON request:")
    print(request.get_data())
    print("Returning.")

    return "<H1>" + str(request.get_data()) + "</H1>"


if __name__ == "__main__":
    app.config["DEBUG"] = True
    print(f"> Opening service on port {PORT}")
    app.run(host="0.0.0.0", port=PORT)
