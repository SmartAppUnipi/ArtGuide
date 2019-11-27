/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

process.env.NODE_ENV = "production"

import { GoogleSearch } from '../src/search/google-search';
import nock from "nock";
import fs from "fs";

describe("Google search", () => {

    const cacheName = "tmpCache.json";

    afterEach(() => {
        if (fs.existsSync(cacheName))
            fs.unlinkSync(cacheName)

    });

    it("Should not error if empty query is provided", () => {
        const googleSearch = new GoogleSearch(cacheName);
        expect(googleSearch.queryCustom(null, "en")).resolves.toBeNull();
        expect(googleSearch.queryRestricted(null, "en")).resolves.toBeNull();
    });

    it("Should return null if google throws", async () => {

        const interceptor = nock("https://www.googleapis.com")
            .get(/customsearch.*/)
            .once()
            .reply(200, { error: { message: "Mock error message" } })

        const googleSearch = new GoogleSearch(cacheName);
        expect(googleSearch.queryCustom("Test error handling", "en")).resolves.toBeNull();
    });

    it("Should return null if google throws 400-500", async () => {

        const interceptor = nock("https://www.googleapis.com")
            .get(/customsearch.*/)
            .once()
            .reply(400, { error: { message: "Mock error message" } })

        const googleSearch = new GoogleSearch(cacheName);
        expect(googleSearch.queryCustom("Test error handling", "en")).resolves.toBeNull();
    });

    it("Should use the provided language", async () => {

        const googleSearch = new GoogleSearch(); // use the real cache to avoid requests to Google
        const resultsEn = await googleSearch.queryCustom("Leaning Tower of Pisa", "en");
        const resultsIt = await googleSearch.queryCustom("Leaning Tower of Pisa", "it");

        expect(resultsEn.items[0].link).toContain("en.wikipedia.org");
        expect(resultsIt.items[0].link).toContain("it.wikipedia.org");

        expect(Number(resultsEn.searchInformation.totalResults)).toBeGreaterThan(Number(resultsIt.searchInformation.totalResults))

    });


})