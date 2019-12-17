/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

process.env.NODE_ENV = "production"

import { Search, GoogleSearch } from '../../src/search';
import nock from "nock";
import fs from "fs";
import { userProfiles } from "../../tests";
import { GoogleSearchResult, Query } from '../../src/models';

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

        nock("https://www.googleapis.com")
            .get(/customsearch.*/)
            .reply(200, { error: { message: "Mock error message for 200 status" } })

        const googleSearch = new GoogleSearch(cacheName);
        expect(googleSearch.query("Test error handling", userProfiles.en.expert)).resolves.toBeNull();
    });

    it("Should return null if google throws 400-500", async () => {

        nock("https://www.googleapis.com")
            .get(/customsearch.*/)
            .reply(400, { error: { message: "Mock error message for 400 status" } })

        const googleSearch = new GoogleSearch(cacheName);
        expect(googleSearch.query("Test error handling", userProfiles.en.expert)).resolves.toBeNull();

    });

    it("Should use the provided language", async () => {

        nock.restore(); // remove all interceptors

        const googleSearch = new GoogleSearch();
        let result = await googleSearch.query("Leaning Tower of Pisa", userProfiles.en.expert);
        expect(result.items[0].link).toContain("en.wikipedia.org");

        result = await googleSearch.query("Leaning Tower of Pisa", userProfiles.it.expert);
        expect(result.items[0].link).toContain("it.wikipedia.org");

    });


});