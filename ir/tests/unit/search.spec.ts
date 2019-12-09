/// <reference types="@types/jest"/>

import { Search } from "../../src/search"
import { Query, GoogleSearchResult } from "../../src/models"


const search = new Search()


const queries: Array<Query> = [
    {
        searchTerms: "mona lisa",
        score: 0.98765432,
        keywords: [],
        language: "en"
    }
]

const queryExpansionResponse = {
    keywordExpansion: {
        taste1: [
            "history"
        ],
        taste2: [
            "style",
            "technique"
        ],
    }
}

const extendedQueries: Array<Query> = [
    {
        searchTerms: 'mona lisa',
        score: 0.98765432,
        keywords: ['history'],
        language: "en"
    },
    {
        searchTerms: 'mona lisa',
        score: 0.98765432,
        keywords: ['style', 'technique'],
        language: "en"
    },
    {
        searchTerms: 'mona lisa',
        score: 0.98765432,
        keywords: [],
        language: "en"
    }
]


describe("Test build query", () => {

    test("Should extend the query", () => {
        const result = search['extendQuery'](queries, queryExpansionResponse);
        // must return an array of (initial queries * #tastes) queries
        expect(result).toBeTruthy();
        expect(result).toHaveLength(3);
        // queries must be well formed
        result.forEach(query => {
            expect(query.searchTerms).toBeTruthy();
            expect(query.score).toBeTruthy();
            expect(query.keywords).toBeTruthy();
        })
        // must produce the expected object
        expect(result).toEqual(extendedQueries)
    })

    it("Should return valid result object if Google returns valid items", async () => {
        const result = await search['buildResult'](extendedQueries);
        // must return an array of well formed page results
        expect(result).toBeTruthy();
        result.forEach(pageResult => {
            // page results must be well formed
            expect(pageResult.url).toBeTruthy();
            expect(pageResult.title).toBeTruthy();
            expect(pageResult.sections).toBeTruthy();
            expect(pageResult.keywords).toBeTruthy();
            expect(pageResult.tags).toBeTruthy();
            // must contain at least 1 section
            expect(pageResult.sections.length).toBeGreaterThan(0)
        })
    })

    it("Should return [] if Google respond in strange ways", async () => {

        const cases = [
            jest.fn(() => Promise.resolve(null)),
            jest.fn(() => Promise.reject(null)),
            jest.fn(() => Promise.resolve({ items: null } as GoogleSearchResult)),
            jest.fn(() => Promise.resolve({ items: [] } as GoogleSearchResult)),
            jest.fn(() => Promise.reject(new Error("Google Test Error")))
        ];

        return Promise.all(cases.map(async mock => {
            // replace the original function with a mock that return the result to test
            search['googleSearch'].queryCustom = mock;

            // invoke the mock under the hoods
            const result = await search['buildResult'](extendedQueries);
            expect(result).toEqual([]);
            expect(mock).toHaveBeenCalled();
        }));

    });

})
