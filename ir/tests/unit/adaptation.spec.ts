/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

import nock from "nock";
import { Adaptation } from '../../src/adaptation';
import { AdaptationEndpoint } from '../../src/environment';
import { QueryExpansionRequest, UserProfile, TailoredTextRequest, PageResult, TailoredTextResponse } from '../../src/models';

import { userProfile } from "../../assets/classification-result/known-en.json"
import queryExpansionResponse from "../../assets/query-expansion-response.json"



describe("Adaptation", () => {

    test("Query expansion (getKeywordExpansion)", async () => {
        const adaptationKeywordUrl = new URL(AdaptationEndpoint.keywords);
        nock(adaptationKeywordUrl.origin)
            .post(adaptationKeywordUrl.pathname)
            .reply((url, body: QueryExpansionRequest, callback) => {
                // verify passes parameters
                expect(body).not.toHaveProperty("classification");
                expect(body.userProfile).toBeDefined();
                // reply with 200 status code and the JSON response
                callback(null, [
                    200,
                    queryExpansionResponse
                ]);
            });
        const adaptation = new Adaptation()
        await expect(adaptation.getKeywordExpansion(userProfile)).resolves.toEqual(queryExpansionResponse);
    });

    test("Adaptation call for summary (getTailoredText)", async () => {
        const adaptationTextUrl = new URL(AdaptationEndpoint.text);
        nock(adaptationTextUrl.origin)
            .post(adaptationTextUrl.pathname)
            .reply((url, body: TailoredTextRequest, callback) => {
                // verify passes parameters
                expect(body).not.toHaveProperty("classification");
                expect(body.userProfile).toBeDefined();
                expect(body.results).toBeDefined();
                expect(body.results.length).toBeGreaterThan(0);
                body.results.forEach(pageResult => {
                    expect(pageResult.score).toBeDefined();
                    expect(pageResult.score).toBeGreaterThan(0);
                    expect(pageResult.sections).toBeDefined();
                    expect(pageResult.sections.length).toBeGreaterThan(0);
                    expect(pageResult.title).toBeDefined();
                    expect(pageResult.title.length).toBeGreaterThan(0);
                    expect(pageResult.url).toBeDefined();
                    expect(pageResult.url.length).toBeGreaterThan(0);
                    expect(pageResult.keywords).toBeDefined();
                    expect(pageResult.tags).toBeDefined();
                });
                // reply with 200 status code and echo the same body
                callback(null, [
                    200,
                    body
                ]);
            });
        const results: Array<PageResult> = [
            {
                title: "Test",
                url: "https://obviously-a-fake.url",
                score: 0.98765432,
                keywords: [],
                tags: [],
                sections: [
                    {
                        title: "The main section",
                        content: "Lorem ipsum...",
                        score: 0.12345679,
                        tags: []
                    }
                ],
                summary: ""
            }
        ]
        const adaptation = new Adaptation()
        await expect(adaptation.getTailoredText(results, userProfile)).resolves.toEqual({ results, userProfile });
    });

})