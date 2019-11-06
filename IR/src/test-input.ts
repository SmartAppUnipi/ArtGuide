import { post } from "./utils"
import json from "../assets/classification-result.json"


post("http://localhost:3000", json).then(JSON.stringify).then(console.log)