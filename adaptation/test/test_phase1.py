import requests 
import json
import os
  
URL = "http://cipizio.it:4321/keywords"

path="./adaptation/data/"

file=input("Insert file for phase 1(must be in data folder): ")

if file == "":
    file = "input_phase1.json"
 
with open(path+file) as file:
    PARAMS = json.load(file)
    r = requests.post(url = URL, json = PARAMS) 
  
data = r.json() 

print(json.dumps(data, indent=2, sort_keys=True))