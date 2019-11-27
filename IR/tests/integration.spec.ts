import request from 'supertest'
import { post } from "../src/utils"
import app from "../src/app"
import nock from 'nock'
import { AdaptationEndpoint } from '../src/environment'
import classificationResult from "../assets/classification-result.json"
import queryExpansionResponse from "../assets/query-expansion-response.json"
import {
    QueryExpansionRequest,
    QueryExpansionResponse,
    ClassificationResult
} from "../src/models"

const adaptationScope = nock(AdaptationEndpoint)

adaptationScope
    .post('/keywords')
    .reply(200, queryExpansionResponse)

adaptationScope
    .post('/tailored_text')
    .reply(200, { message: "Mock" })

describe("Integration tests", () => {

    it("Should return 200 status code", () => {
        return request(app)
            .post("/")
            .send(classificationResult)
            .then(response => {
                //assert(response.body.email, 'foo@bar.com')
                console.error(response.body)
            })
    })

})