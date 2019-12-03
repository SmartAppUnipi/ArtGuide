/// <reference types="@types/jest"/>

import request from 'supertest'
import app from "../src/app"
import nock from 'nock'
import { AdaptationEndpoint } from '../src/environment'
import { UserProfile, PageResult } from '../src/models'
import logger from '../src/logger'

import queryExpansionResponse from "../assets/query-expansion-response.json"
import knownEntityEn from "../assets/classification-result/known-en.json"
import knownEntityIt from "../assets/classification-result/known-it.json"
import unknownEntityEn from "../assets/classification-result/unknown-en.json"
import unknownEntityIt from "../assets/classification-result/unknown-it.json"

// ### Flag to mock adaptation server ###
const mockAdaptationEndpoints = true;
// ### Flag to mock adaptation server ###

if (mockAdaptationEndpoints) {
    const adaptationKeywordUrl = new URL(AdaptationEndpoint.keywords);
    nock(adaptationKeywordUrl.origin)
        .post(adaptationKeywordUrl.pathname)
        .times(100)
        .reply((url, body: { userProfile: UserProfile }, callback) => {

            logger.error(`
            **********************
            * /KEYWORDS ENDPOINT *
            **********************
            RECEIVED
            ${JSON.stringify(body, null, 2)}

            REPLY WITH
            ${JSON.stringify(queryExpansionResponse, null, 2)}
            **********************
            `)

            // reply with 200 status code and the JSON response
            callback(null, [
                200,
                queryExpansionResponse
            ]);
        });

    const adaptationTextUrl = new URL(AdaptationEndpoint.text);
    nock(adaptationTextUrl.origin)
        .post(adaptationTextUrl.pathname)
        .times(100)
        .reply((url, body: { userProfile: UserProfile, results: Array<PageResult> }, callback) => {

            logger.error(`
            ************************
            * /ADAPTATION ENDPOINT *
            ************************
            RECEIVED
            ${JSON.stringify(body, null, 2)}
            ************************
            `)

            // reply with 200 status code and a mock JSON response
            callback(null, [
                200,
                body
            ]);
        });
}


it.skip("Should return 200 and match user profile we passed", () => {

    const classificationResult = knownEntityEn

    logger.error(`
            ******************
            * IMAGE ANALYSIS *
            ******************
            SEND
            ${JSON.stringify(classificationResult, null, 2)}
            ******************
            `)


    return request(app)
        .post("/")
        .send(classificationResult)
});

