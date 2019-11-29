/// <reference types="@types/jest"/>

import request from 'supertest'
import app from "../src/app"
import nock from 'nock'
import { AdaptationEndpoint } from '../src/environment'
import { UserProfile, PageResult } from '../src/models'

import knownEntityEn from "../assets/classification-result/known-en.json"
import knownEntityIt from "../assets/classification-result/known-it.json"
import unknownEntityEn from "../assets/classification-result/unknown-en.json"
import unknownEntityIt from "../assets/classification-result/unknown-it.json"
import queryExpansionResponse from "../assets/query-expansion-response.json"

// ### Flag to mock adaptation server ###
const mockAdaptationEndpoints = true;
// ### Flag to mock adaptation server ###

if (!mockAdaptationEndpoints) {
    const adaptationKeywordUrl = new URL(AdaptationEndpoint.keywords);
    nock(adaptationKeywordUrl.origin)
        .post(adaptationKeywordUrl.pathname)
        .reply((url, body: { userProfile: UserProfile }, callback) => {

            // verify passes parameters
            expect(body).not.toHaveProperty("classification");
            expect(body.userProfile).toBeDefined();

            // reply with 200 status code and the JSON response
            callback(null, [
                200,
                queryExpansionResponse
            ]);
        });

    const adaptationTextUrl = new URL(AdaptationEndpoint.text);
    nock(adaptationTextUrl.origin)
        .post(adaptationTextUrl.pathname)
        .reply((url, body: { userProfile: UserProfile, results: Array<PageResult> }, callback) => {

            // verify passes parameters
            expect(body).not.toHaveProperty("classification");
            expect(body.userProfile).toBeDefined();
            expect(body.results).toBeDefined();

            // reply with 200 status code and a mock JSON response
            callback(null, [
                200,
                { message: "Mock" }
            ]);
        });
}


describe("Integration tests with KNOWN entity in english", () => {
    it("Should return 200 and match user profile we passed", () => {
        return request(app)
            .post("/")
            .send(knownEntityEn)
            .then(response => {
                expect(response.status).toEqual(200);
                expect(response.body.userProfile).toEqual({
                    id: 42,
                    language: "en",
                    tastes: ["history", "description", "legacy"],
                    expertiseLevel: 1
                });
            })
    });
});

describe("Integration tests with KNOWN entity in italian", () => {
    it("Should return 200 and match user profile we passed", () => {
        return request(app)
            .post("/")
            .send(knownEntityIt)
            .then(response => {
                expect(response.status).toEqual(200);
                expect(response.body.userProfile).toEqual({
                    id: 42,
                    language: "it",
                    tastes: ["storia", "chimica", "arte"],
                    expertiseLevel: 1
                });
            })
    });
});

describe("Integration tests with UNKNOWN entity in english", () => {
    it("Should return 200 and match user profile we passed", () => {
        return request(app)
            .post("/")
            .send(unknownEntityEn)
            .then(response => {
                expect(response.status).toEqual(200);
                expect(response.body.userProfile).toEqual({
                    id: 42,
                    language: "en",
                    tastes: ["curiosity", "author"],
                    expertiseLevel: 1
                });
            })
    });
});

describe("Integration tests with UNKNOWN entity in italian", () => {
    it("Should return 200 and match user profile we passed", () => {
        return request(app)
            .post("/")
            .send(unknownEntityIt)
            .then(response => {
                expect(response.status).toEqual(200);
                expect(response.body.userProfile).toEqual({
                    id: 42,
                    language: "it",
                    tastes: ["storia", "stile"],
                    expertiseLevel: 2
                });
            })
    });
});

