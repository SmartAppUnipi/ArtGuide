import fetch from "node-fetch"
import { post } from "./utils"
import { AdaptationEndpoint } from "./environment"

function queryExpansion(classificationResult : any) {
  post(AdaptationEndpoint, JSON.stringify(classificationResult.userProfile))
}

export {
  queryExpansion
}