/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

process.env.NODE_ENV = "production"

import { GoogleSearch } from '../../src/search/google-search';
import nock from "nock";
import fs from "fs";
import { GoogleSearchConfig } from "../../src/environment";
import { userProfiles } from "../../tests";

describe("Google search", () => {

    const cacheName = "tmpCache.json";

    afterEach(() => {
        if (fs.existsSync(cacheName))
            fs.unlinkSync(cacheName)

    });

    it("Should not error if empty query is provided", () => {
        const googleSearch = new GoogleSearch(cacheName);
        expect(googleSearch.query(null, userProfiles.en.expert)).resolves.toBeNull();
    });

    it("Should return null if google throws", async () => {

        const interceptor = nock("https://www.googleapis.com")
            .get(/customsearch.*/)
            .once()
            .reply(200, { error: { message: "Mock error message" } })

        const googleSearch = new GoogleSearch(cacheName);
        expect(googleSearch.query("Test error handling", userProfiles.en.expert)).resolves.toBeNull();
    });

    it("Should return null if google throws 400-500", async () => {

        const interceptor = nock("https://www.googleapis.com")
            .get(/customsearch.*/)
            .once()
            .reply(400, { error: { message: "Mock error message" } })

        const googleSearch = new GoogleSearch(cacheName);
        expect(googleSearch.query("Test error handling", userProfiles.en.expert)).resolves.toBeNull();
    });

    it("Should use the provided language", async () => {

        if (process.env.CI) {
            console.warn("Skipping since .env is missing.")
            return;
        }

        const googleSearch = new GoogleSearch(); // use the real cache to avoid requests to Google

        const mock = jest.fn();
        googleSearch["_query"] = mock

        await googleSearch.query("Leaning Tower of Pisa", userProfiles.en.expert);
        expect(mock).toHaveBeenCalledWith(
            expect.stringContaining(GoogleSearchConfig.searchEngineId.en),
            "Leaning Tower of Pisa",
            userProfiles.en.expert
        );

        await googleSearch.query("Torre di Pisa", userProfiles.it.expert);
        expect(mock).toHaveBeenCalledWith(
            expect.stringContaining(GoogleSearchConfig.searchEngineId.it),
            "Torre di Pisa",
            userProfiles.it.expert
        );

    });


})