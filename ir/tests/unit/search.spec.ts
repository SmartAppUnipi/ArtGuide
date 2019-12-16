/// <reference types="@types/jest"/>

import { Search } from "../../src/search"
import { Query, GoogleSearchResult } from "../../src/models"
import { userProfiles } from ".."
import { GoogleSearch } from "../../src/search/google-search"


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

    it("Should return valid result object, without black list websites, if Google returns valid items", async () => {
        const result = await search['buildResult'](extendedQueries, userProfiles.en.expert);
        // must return an array of well formed page results
        expect(result).toBeTruthy();
        result.forEach(pageResult => {
            // page results must be well formed
            expect(pageResult.url).toBeTruthy();
            expect(pageResult.url).not.toContain("wikipedia");
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
            search['googleSearch'].query = mock;

            // invoke the mock under the hoods
            const result = await search['buildResult'](extendedQueries, userProfiles.en.expert);
            expect(result).toEqual([]);
            expect(mock).toHaveBeenCalled();
        }));

    });

});

describe("Google safe search for kids", () => {
    it("Should return kids content from kiddle.co", async () => {
        const _google = new GoogleSearch();
        const kidResults = await _google.query("pisa tower", userProfiles.en.kid);
        for (let result of kidResults.items) {
            expect(result.link).toContain("kids.kiddle.co");
        }
    });
});


describe("Duplicate results", () => {

    const gResultsWithDuplicates: Array<{ gResult: GoogleSearchResult, query: Query }> = [
        {
            query: {
                keywords: ["one", "one", "two"],
                score: 1
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
                keywords: ["one", "three", "four"],
                score: 2
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
                keywords: ["one", "five"],
                score: 3
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
                keywords: ["six"],
                score: 4
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
                keywords: ["five", "test"],
                score: 5
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
            keywords: ["one", "two", "three", "four", "five"],
            score: (1 + 2 + 3) / 3 // average between matching queries
        });
        expect(gResultsNoDuplicates[1]).toEqual({
            url: "__2__",
            keywords: ["one", "two"],
            score: 1
        });
        expect(gResultsNoDuplicates[2]).toEqual({
            url: "__3__",
            keywords: ["one", "three", "four"],
            score: 2
        });
        expect(gResultsNoDuplicates[3]).toEqual({
            url: "__4__",
            keywords: ["one", "three", "four"],
            score: 2
        });
        expect(gResultsNoDuplicates[4]).toEqual({
            url: "__5__",
            keywords: ["one", "five", "test"],
            score: (3 + 5) / 2
        });
        expect(gResultsNoDuplicates[5]).toEqual({
            url: "__6__",
            keywords: ["six"],
            score: 4
        });
    });

});