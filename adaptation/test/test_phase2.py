import requests 
import json
import os
  
URL = "http://localhost:4321/tailored_text"
   
path="./adaptation/data/"

file=input("Insert file for phase 2(must be in data folder): ")

if file == "":
    file = "input_phase2.json"
 
with open(path+file) as file:
    PARAMS = json.load(file)
    r = requests.post(url = URL, json = PARAMS) 
  
data = r.json() 

print(json.dumps(data, indent=2, sort_keys=True))