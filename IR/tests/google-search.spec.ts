/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

import { GoogleSearch } from '../src/search/google-search';
import nock from "nock";

describe("Google search", () => {

    it("Should not error if empty query is provided", () => {
        const googleSearch = new GoogleSearch();
        expect(googleSearch.queryCustom(null)).resolves.toBeNull();
        expect(googleSearch.queryRestricted(null)).resolves.toBeNull();
    });

    it("Should throw error if google throws it", () => {

        nock("https://www.googleapis.com")
            .get(/customsearch.*/)
            .reply(200, { error: { message: "Mock error message" } })

        const googleSearch = new GoogleSearch("tmpCache.json");
        expect(googleSearch.queryCustom("Test entry")).rejects
        googleSearch["cacheService"].initialize();
    });

})