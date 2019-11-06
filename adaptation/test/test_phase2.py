import requests 
import json
import os
  
URL = "http://cipizio.it:4321/tailored_text"
   
with open("./adaptation/data/input_phase2.json") as file:
    PARAMS = json.load(file)
    r = requests.post(url = URL, json = PARAMS) 
  
data = r.json() 
  
print(data)