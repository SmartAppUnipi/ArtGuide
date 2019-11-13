/// <reference types="@types/jest"/>

import request from 'supertest'
import app from "../src/app"
import nock from 'nock'
import { AdaptationEndpoint } from '../src/environment'
import classificationResult from "../assets/classification-result.json"
import queryExpansionResponse from "../assets/query-expansion-response.json"


const adaptationScope = nock(AdaptationEndpoint)

adaptationScope
    .post('/keywords')
    .reply(200, queryExpansionResponse)

adaptationScope
    .post('/tailored_text')
    .reply(200, { message: "Mock" })

describe("Integration tests", () => {

    it("Should respond properly", () => {
        return request(app)
            .post("/")
            .send(classificationResult)
            .then(response => {
                expect(response.status).toEqual(200)
                expect(response.body.message).toEqual('Mock')
            })
    })

})