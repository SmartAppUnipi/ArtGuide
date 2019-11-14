/// <reference types="@types/jest"/>

import { Search } from "../src/search"
import { Query, PageResult } from "../src/models"


const search = new Search()


const queries: Array<Query> = [
    {
        searchTerms: "mona lisa",
        score: 0.98765432,
        keywords: [],
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
        keywords: ['history']
    },
    {
        searchTerms: 'mona lisa',
        score: 0.98765432,
        keywords: ['style', 'technique']
    }
]


describe("Test build query", () => {

    test("extendQuery", async () => {
        const result = await search['extendQuery'](queries, queryExpansionResponse);
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

    test("buildResult", async () => {
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
            console.log(result)
            // TODO: test
            // - queryResult null
            // - queryResult.items empty or null
            // - if google throw error
        })
    })

})
