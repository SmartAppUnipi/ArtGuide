/// <reference types="@types/jest"/>

import request from 'supertest'
import app from "../src/app"


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
