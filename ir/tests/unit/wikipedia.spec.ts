/// <reference types="@types/jest"/>

import { Wikipedia, WikiData } from "../../src/wiki"
import { MetaEntity, Entity } from "../../src/models";
import unknownEntityEn from "../../assets/classification-result/unknown-en.json"
import { reduceEntities } from "../../src/utils";
import * as config from "../../config.json";

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

        const metaEntity: MetaEntity = await wikidata["getProperties"]({ entityId: "/m/0cn46", score: 1 } as Entity, "en"); // pisa tower
        const knownInstance = await wikidata['setWikipediaNames'](metaEntity, "en");

        const results = await wiki.searchKnownInstance(knownInstance, "en");

        expect(results).toHaveLength(2);  // Pisa Tower + Bonanno Pisano
        expect(results[0].title).toEqual("Leaning Tower of Pisa");
        expect(results[1].title).toEqual("Bonanno Pisano");

    });
});

describe("Wikipedia search for unknown entity", () => {
    it("Should look for art-related MetaEntities", async () => {
        const wiki = new Wikipedia();
        const wikidata = new WikiData();
        let entities: Array<Entity> = [].concat(
            unknownEntityEn?.classification?.entities ?? [],
            unknownEntityEn?.classification?.labels ?? []
        );
        entities.sort((e1, e2) => e2.score - e1.score);

        // 3. slice entities reducing the number of results
        entities = reduceEntities(
            entities,
            config.flowConfig.entityFilter.maxEntityNumber,
            config.flowConfig.entityFilter.minScore
        );
        const metaEntities = await Promise.all(entities.map(entity => wikidata.getProperties(entity, "en")));
        const filteredEntities = await wikidata.filterNotArtRelatedResult(metaEntities);
        const res = await wiki.search(filteredEntities, "en");
        //console.log(res);
        expect(res).toHaveLength(1);
        expect(res[0].title).toEqual("Modern art");
    });
});

describe("Fuzzy", () => {

    describe("Wikipedia.search", () => {
        it("Empty entities", async () => {
            const wikipedia = new Wikipedia();
            const res = await wikipedia.search([], "en");
            expect(res).toHaveLength(0);
            expect(res).toEqual([])
        });

        it("Null entities", async () => {
            const wikipedia = new Wikipedia();
            const res = await wikipedia.search(null, "en");
            expect(res).toHaveLength(0);
            expect(res).toEqual([])
        });

        it("Array with null", async () => {
            const wikipedia = new Wikipedia();
            const res = await wikipedia.search([null], "en");
            expect(res).toHaveLength(0);
            expect(res).toEqual([])
        });

        it("Malformed entities (page name null)", async () => {
            const malformedEntity = [
                {
                    wikipediaPageTitle: null,
                    score: -1
                }
            ] as Array<MetaEntity>
            const wikipedia = new Wikipedia();
            const res = await wikipedia.search(malformedEntity, "en");
            expect(res).toHaveLength(0);
            expect(res).toEqual([]);
        });

        it("Malformed entities (score null)", async () => {
            const malformedEntity = [
                {
                    wikipediaPageTitle: "Something",
                    score: null
                }
            ] as Array<MetaEntity>
            const wikipedia = new Wikipedia();
            const res = await wikipedia.search(malformedEntity, "en");
            expect(res).toHaveLength(1);
            expect(res[0].score).toEqual(null);
        });

        it("Null language", async () => {
            const entity = [
                {
                    wikipediaPageTitle: "Something",
                    score: 1
                }
            ] as Array<MetaEntity>
            const wikipedia = new Wikipedia();
            const res = await wikipedia.search(entity, null);
            expect(res).toHaveLength(0);
            expect(res).toEqual([]);

        });
    });

    describe("Wikipedia.searchKnownInstance", () => {
        it("Null entity", async () => {
            const wikipedia = new Wikipedia();
            const res = await wikipedia.searchKnownInstance(null, "en");
            expect(res).toHaveLength(0);
            expect(res).toEqual([]);
        });

        it("Malformed entity (page name null)", async () => {
            const malformedEntity = {
                wikipediaPageTitle: null,
                score: -1
            } as MetaEntity
            const wikipedia = new Wikipedia();
            const res = await wikipedia.searchKnownInstance(malformedEntity, "en");
            expect(res).toHaveLength(0);
            expect(res).toEqual([]);
        });

        it("Malformed entity (score null)", async () => {
            const malformedEntity = {
                wikipediaPageTitle: "Something",
                score: null
            } as MetaEntity
            const wikipedia = new Wikipedia();
            const res = await wikipedia.searchKnownInstance(malformedEntity, "en");
            expect(res).toHaveLength(1);
            expect(res[0].score).toEqual(null);
        });

        it("Malformed entity (empty array as property)", async () => {
            const malformedEntity = {
                wikipediaPageTitle: "Something",
                score: 1,
                creator: []
            } as any as MetaEntity
            const wikipedia = new Wikipedia();
            const res = await wikipedia.searchKnownInstance(malformedEntity, "en");
            expect(res).toHaveLength(1); // only the wikipedia page, without creator
            expect(res[0].score).toEqual(1);
        });

        it("Malformed entity (empty array as property)", async () => {
            const malformedEntity = {
                wikipediaPageTitle: "Something",
                score: 1,
                creator: null
            } as any as MetaEntity
            const wikipedia = new Wikipedia();
            const res = await wikipedia.searchKnownInstance(malformedEntity, "en");
            expect(res).toHaveLength(1); // only the wikipedia page, without creator
            expect(res[0].score).toEqual(1);
        });

        it("Malformed entity (array with null value as property)", async () => {
            const malformedEntity = {
                wikipediaPageTitle: "Something",
                score: 1,
                creator: [null]
            } as any as MetaEntity
            const wikipedia = new Wikipedia();
            const res = await wikipedia.searchKnownInstance(malformedEntity, "en");
            expect(res).toHaveLength(1); // only the wikipedia page, without creator
            expect(res[0].score).toEqual(1);
        });

        it("Null language", async () => {
            const entity = {
                wikipediaPageTitle: "Something",
                score: 1
            } as MetaEntity
            const wikipedia = new Wikipedia();
            const res = await wikipedia.searchKnownInstance(entity, null);
            expect(res).toHaveLength(0);
            expect(res).toEqual([]);

        });
    });

});