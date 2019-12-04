/// <reference types="@types/jest"/>

import request from 'supertest'
import app from "../src/app"
import nock from 'nock'
import { AdaptationEndpoint } from '../src/environment'
import { UserProfile, PageResult } from '../src/models'
import logger from '../src/logger'

import queryExpansionResponse from "../assets/query-expansion-response.json"
import knownEntityEn from "../assets/classification-result/known-en.json"

// ### Flag to mock adaptation server ###
const mockAdaptationEndpoints = true;
// ### Flag to mock adaptation server ###

if (mockAdaptationEndpoints) {
    const adaptationKeywordUrl = new URL(AdaptationEndpoint.keywords);
    nock(adaptationKeywordUrl.origin)
        .post(adaptationKeywordUrl.pathname)
        .times(100)
        .reply((url, body: { userProfile: UserProfile }, callback) => {

            logger.error(`Adaptation endpoint: ${adaptationKeywordUrl.pathname}`, {
                received: body,
                replay: queryExpansionResponse
            });

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

            logger.error(`Adaptation endpoint: ${adaptationTextUrl.pathname}`, {
                receivedFromIr: body
            });

            // reply with 200 status code and a mock JSON response
            callback(null, [
                200,
                body
            ]);
        });
}

describe.skip("IR module", () => {
    it("Should log on file all excanged JSON files", () => {

        const classificationResult = knownEntityEn

        logger.error(`Image analysis module`, { sentToIrModule: classificationResult })

        return request(app)
            .post("/")
            .send(classificationResult)
    });
});

