/// <reference types="@types/jest"/>

import { Wikipedia } from "../../src/wiki"
import { PageResult, ClassificationResult, Query, KnownInstance } from "../../src/models";
import knownEntityEn from "../../assets/classification-result/known-en.json";


describe("Function getWikiInfo", () => {
    test("it should return a Promise<PageResult>", async () => {

        const wikijs = new Wikipedia()
        const result = await wikijs['getWikiInfo']("mona lisa", "en", 0.5);

        expect(result).toBeDefined();

        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('sections');
        expect(result).toHaveProperty('keywords');

        expect(result.title).toBeDefined();
        expect(result.url).toBeDefined();
        expect(result.keywords).toBeDefined();
        expect(result.sections).toHaveLength(14);
    });
});

describe("Wikipedia.search(classificationResult)", () => {
    it("Should replay correctly for Pisa Tower", async () => {
        const wiki = new Wikipedia();

        const getWikiInfoMock = jest.fn().mockImplementation(
            () => new PageResult({ title: "Leaning Tower Of Pisa" })
        );
        wiki['getWikiInfo'] = getWikiInfoMock;

        const buildQueriesMock = jest.fn().mockImplementation(async (classificationResult: ClassificationResult) => {
            return [
                new Query({
                    searchTerms: classificationResult.classification.entities[0].description,
                    score: classificationResult.classification.entities[0].score,
                    language: "en"
                }),
                new Query({
                    searchTerms: classificationResult.classification.entities[1].description,
                    score: classificationResult.classification.entities[1].score,
                    language: "en"
                })
            ];
        });
        wiki['buildQueries'] = buildQueriesMock;

        const results = await wiki['search'](knownEntityEn as any);

        expect(buildQueriesMock).toHaveBeenCalledTimes(1);
        expect(getWikiInfoMock).toHaveBeenCalledTimes(2);
        expect(results.length).toEqual(2);
        expect(results[0].title).toEqual("Leaning Tower Of Pisa");

    });
});

describe("Wikipedia.searchKnownInstance(knownInstance)", () => {
    it("Should replay correctly for Pisa Tower", async () => {
        const wiki = new Wikipedia();

        const getWikiInfoMock = jest.fn().mockImplementation(
            () => new PageResult({ title: "Leaning Tower Of Pisa", summary: "Test summary" })
        );
        wiki['getWikiInfo'] = getWikiInfoMock;



        const results = await wiki.searchKnownInstance(
            { WikipediaPageTitle: "Leaning Tower Of Pisa" } as KnownInstance,
            "en"
        );
        expect(getWikiInfoMock).toHaveBeenCalledTimes(1);

        expect(results.length).toEqual(1);
        expect(results[0].summary).toContain("Test");

    });
});

describe("Wikipedia.buildQueries(classificationResult)", () => {
    it("Should replay correctly for Pisa Tower", async () => {
        const wiki = new Wikipedia();

        const getWikipediaNameMock = jest.fn()
            .mockImplementationOnce(async () => "Test Wikipedia 1")
            .mockImplementationOnce(async () => "Test Wikipedia 2")
            .mockImplementationOnce(async () => "Test Wikipedia 3")

        wiki["wikidata"]["getWikipediaName"] = getWikipediaNameMock;

        const results = await wiki["buildQueries"](knownEntityEn as any);
        expect(getWikipediaNameMock).toHaveBeenCalledTimes(3);

        expect(results.length).toEqual(3);

        results.forEach((r, i) => {
            expect(r.searchTerms).toEqual(`Test Wikipedia ${i + 1}`)
        });


    });
});