/// <reference types="@types/jest"/>

import { Wikipedia, WikiData } from "../../src/wiki"
import { MetaEntity, Entity } from "../../src/models";
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
        const wikidata = new WikiData();

        const metaEntity = await wikidata["getProperties"]({ entityId: "/m/0cn46", score: 1 } as Entity, "en"); // pisa tower
        const knownInstance = await wikidata['setWikipediaNames'](metaEntity, "en");

        const results = await wiki.searchKnownInstance(knownInstance, "en");

        expect(results.length).toEqual(2);  // Pisa Tower + Bonanno Pisano
        expect(results[0].title).toEqual("Leaning Tower of Pisa");

    });
});
