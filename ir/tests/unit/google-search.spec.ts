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


})

describe.only("Duplicate results", () => {

    const gResultsWithDuplicates: Array<{ gResult: GoogleSearchResult, query: Query }> = [
        {
            query: {
                keywords: ["one", "two"]
            },
            gResult: {
                items: [
                    {
                        link: "__1__",
                    },
                    {
                        link: "__2__",
                    }
                ]
            }
        },
        {
            query: {
                keywords: ["one", "three", "four"]
            },
            gResult: {
                items: [
                    {
                        link: "__1__",
                    },
                    {
                        link: "__3__",
                    },
                    {
                        link: "__4__",
                    }
                ]
            }
        },
        {
            query: {
                keywords: ["one", "five"]
            },
            gResult: {
                items: [
                    {
                        link: "__1__",
                    },
                    {
                        link: "__5__",
                    }
                ]
            }
        },
        {
            query: {
                keywords: ["six"]
            },
            gResult: {
                items: [
                    {
                        link: "__6__",
                    }
                ]
            }
        },
        {
            query: {
                keywords: ["five", "test"]
            },
            gResult: {
                items: [
                    {
                        link: "__5__",
                    }
                ]
            }
        }
    ] as Array<any>;

    it("Should remove duplicates results", () => {
        const _search = new Search();

        const gResultsNoDuplicates = _search.mergeDuplicateUrls(gResultsWithDuplicates);

        const set = new Set<string>();
        for (let r of gResultsNoDuplicates) {
            set.add(r.url);
        }
        expect(set.size).toEqual(6);
    });

    it("Should merge duplicates keywords", () => {
        const _search = new Search();

        const gResultsNoDuplicates = _search.mergeDuplicateUrls(gResultsWithDuplicates);

        expect(gResultsNoDuplicates.length).toEqual(6);
        expect(gResultsNoDuplicates[0]).toEqual({
            url: "__1__",
            keywords: ["one", "two", "three", "four", "five"]
        });
        expect(gResultsNoDuplicates[1]).toEqual({
            url: "__2__",
            keywords: ["one", "two"]
        });
        expect(gResultsNoDuplicates[2]).toEqual({
            url: "__3__",
            keywords: ["one", "three", "four"]
        });
        expect(gResultsNoDuplicates[3]).toEqual({
            url: "__4__",
            keywords: ["one", "three", "four"]
        });
        expect(gResultsNoDuplicates[4]).toEqual({
            url: "__5__",
            keywords: ["one", "five","test"]
        });
        expect(gResultsNoDuplicates[5]).toEqual({
            url: "__6__",
            keywords: ["six"]
        });
    });
});