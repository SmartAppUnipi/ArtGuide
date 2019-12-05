/// <reference types="@types/jest"/>

import { Wikipedia } from "../../src/wiki"
import { PageResult, ClassificationResult, Query, MetaEntity } from "../../src/models";
import knownEntityEn from "../../assets/classification-result/known-en.json";

describe("Function getWikiInfo", () => {
    test("it should return a Promise<PageResult>", async () => {

        const wikijs = new Wikipedia()
        const result = await wikijs['getWikiInfo']("Mona Lisa", "en", 0.5);

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

describe("Wikipedia.searchKnownInstance(knownInstance)", () => {
    it("Should replay correctly for Pisa Tower", async () => {
        const wiki = new Wikipedia();

        const getWikiInfoMock = jest.fn().mockImplementation(
            () => ({ title: "Leaning Tower Of Pisa", summary: "Test summary" })
        );
        wiki['getWikiInfo'] = getWikiInfoMock;



        const results = await wiki.searchKnownInstance(
            { WikipediaPageTitle: "Leaning Tower Of Pisa" } as any as MetaEntity,
            "en"
        );
        expect(getWikiInfoMock).toHaveBeenCalledTimes(1);

        expect(results.length).toEqual(1);
        expect(results[0].summary).toContain("Test");

    });
});
