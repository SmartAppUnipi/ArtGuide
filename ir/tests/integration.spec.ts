/// <reference types="@types/jest"/>

import request from 'supertest'
import app from "../src/app"

import knownEntityEn from "../assets/classification-result/known-en.json"
import knownEntityIt from "../assets/classification-result/known-it.json"
import unknownEntityEn from "../assets/classification-result/unknown-en.json"
import unknownEntityIt from "../assets/classification-result/unknown-it.json"
import { mockAdaptation } from '.'

// ### Mock adaptation server ###
mockAdaptation(true);
// ### Mock adaptation server ###

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

