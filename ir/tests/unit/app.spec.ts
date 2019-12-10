/// <reference types="@types/jest"/>

import request from 'supertest'
import app from "../../src/app"
import { userProfiles, mockAdaptation } from '../../tests';
import { TailoredTextResponse, ExpertizeLevelType } from '../../src/models';
import knownEntityEn from "../../assets/classification-result/known-en.json";


// ### Mock adaptation server ###
mockAdaptation(true);
// ### Mock adaptation server ###

describe("App edge input cases", () => {
    it("Should return 400 if an unsupported language is provided", () => {
        return request(app)
            .post("/")
            .send({
                userProfile: {
                    language: "ru"
                },
                classification: {}
            }).then(r => {
                expect(r.status).toEqual(400);
                expect(r.body.error).toContain("Unsupported language");
            });
    });

    it("Should return 400 if body is not provided", () => {
        return request(app)
            .post("/")
            .then(r => {
                expect(r.status).toEqual(400);
                expect(r.body.error).toContain("Missing required body");
            });
    });
});

describe("Kid user profiles", () => {
    it("Should not include Wikipedia results when user profile is a kid", () => {
        return request(app)
            .post("/")
            .send({ ...knownEntityEn, userProfile: userProfiles.en.kid })
            .then(response => {
                expect(response.status).toEqual(200);
                const body = response.body as TailoredTextResponse;
                expect(body.userProfile.expertiseLevel).toEqual(ExpertizeLevelType.Child);
                for (let pageResult of body.results) {
                    expect(pageResult.url).not.toContain("wikipedia");
                }
            });
    });
});