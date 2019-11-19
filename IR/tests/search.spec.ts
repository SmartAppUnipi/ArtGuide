/// <reference types="@types/jest"/>

import { Search } from "../src/search"
import { Query, PageResult, GoogleSearchResult } from "../src/models"


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
    }
]


describe("Test build query", () => {

    test("Should extend the query", () => {
        const result = search['extendQuery'](queries, queryExpansionResponse);
        // must return an array of (initial queries * #tastes) queries
        expect(result).toBeDefined();
        expect(result).toHaveLength(2);
        // queries must be well formed
        result.forEach(query => {
            expect(query.searchTerms).toBeDefined();
            expect(query.score).toBeDefined();
            expect(query.keywords).toBeDefined();
        })
        // must produce the expected object
        expect(result).toEqual(extendedQueries)
    })

    it("Should return valid result object if Google returns valid items", async () => {
        const result = await search['buildResult'](extendedQueries);
        // must return an array of well formed page results
        expect(result).toBeDefined();
        result.forEach(pageResult => {
            // page results must be well formed
            expect(pageResult.url).toBeDefined();
            expect(pageResult.title).toBeDefined();
            expect(pageResult.sections).toBeDefined();
            expect(pageResult.keywords).toBeDefined();
            expect(pageResult.tags).toBeDefined();
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
