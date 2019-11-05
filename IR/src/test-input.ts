import fetch from "node-fetch"
import json from "../assets/classification-result.json"
import { post } from "./utils"

post("http://localhost:3000", json).then(r => {
    console.log(r)
});