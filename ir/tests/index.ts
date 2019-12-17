/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

import { UserProfile, ExpertizeLevelType, PageResult } from "../src/models";
import nock from "nock";
import { AdaptationEndpoint } from "../src/environment";
import queryExpansionResponse from "../assets/query-expansion-response.json";

export const userProfiles = {
    en: {
        expert: {
            expertiseLevel: ExpertizeLevelType.Expert,
            language: "en",
            tastes: ["history"]
        } as UserProfile,
        kid: {
            expertiseLevel: ExpertizeLevelType.Child,
            language: "en",
            tastes: ["history"]
        } as UserProfile
    },
    it: {
        expert: {
            expertiseLevel: ExpertizeLevelType.Expert,
            language: "it",
            tastes: ["storia"]
        } as UserProfile,
        kid: {
            expertiseLevel: ExpertizeLevelType.Child,
            language: "it",
            tastes: ["storia"]
        } as UserProfile
    }
};

export function mockAdaptation(enable: boolean) {

    if (enable) {
        const adaptationKeywordUrl = new URL(AdaptationEndpoint.keywords);
        nock(adaptationKeywordUrl.origin)
            .persist()
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
            .persist()
            .post(adaptationTextUrl.pathname)
            .reply((url, body: { userProfile: UserProfile, results: Array<PageResult> }, callback) => {

                // verify passes parameters
                expect(body).not.toHaveProperty("classification");
                expect(body.userProfile).toBeDefined();
                expect(body.results).toBeDefined();
                body.results.forEach(pageResult => {
                    expect(pageResult.score).toBeGreaterThan(0);
                });

                // reply with 200 status code and a mock JSON response
                callback(null, [
                    200,
                    body
                ]);
            });
    }
}