import fetch from "node-fetch"
import json from "../assets/input.json"
import { post } from "./utils"

post("localhost:3000", JSON.stringify(json))