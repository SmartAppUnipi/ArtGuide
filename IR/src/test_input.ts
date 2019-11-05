import fetch from "node-fetch"
import json from "../assets/input.json"

function post(url: string, json: string) {

  fetch(url, {
    method: 'POST',
    body: json,
    headers: { 'Content-Type': 'application/json' },
  })
  .then(res => res.json()).then(console.log)
}

post("localhost:3000", JSON.stringify(json))