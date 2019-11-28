/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

import request from 'supertest'
import app from "../src/app"
import classificationResult from "../assets/classification-result.json"
import fs from "fs";

const skip = true;
describe.skip("Integration tests without Google cache", () => {

    beforeAll(() => {
        if (!skip) {
            // rename the current google cache, so that the cache service recreates an empty one 
            fs.renameSync("google-cache.json", "google-cache.bk.json");
        }
    });

    afterAll(() => {
        if (!skip) {
            // delete the cache produces in test run and restore the original one
            fs.unlinkSync("google-cache.json")
            fs.renameSync("google-cache.bk.json", "google-cache.json");
        }
    });

    it("Should return 200 and match user profile we passed", () => {
        return request(app)
            .post("/")
            .send(classificationResult)
            .then(response => {
                expect(response.status).toEqual(200);
                expect(response.body.userProfile).toEqual({
                    id: 42,
                    language: "en",
                    tastes: ["history", "description", "legacy"],
                    expertiseLevel: 1
                });
                /**
                 * Current cipizio response:
                    {
                        results: [null, null],
                        tailoredText: ‘Content not found’,
                        userProfile:
                        {
                            expertiseLevel: 1,
                            id: 42,
                            language: ‘en’,
                            tastes: [‘history’, ‘description’, ‘legacy’]
                        }
                    }
                */
            })
    })

})
