/// <reference types="@types/jest"/>

import { Wikipedia, WikiData } from "../../src/wiki"
import { MetaEntity, Entity } from "../../src/models";
import knownEntityEn from "../../assets/classification-result/known-en.json";
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

        const metaEntity : MetaEntity = await wikidata["getProperties"]({ entityId: "/m/0cn46", score: 1 } as Entity, "en"); // pisa tower
        const knownInstance = await wikidata['setWikipediaNames'](metaEntity, "en");

        const results = await wiki.searchKnownInstance(knownInstance, "en");

        expect(results.length).toEqual(2);  // Pisa Tower + Bonanno Pisano
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
        const res = await wiki.search(metaEntities, "en");
        //console.log(res);
        expect(res.length).toEqual(1);
        expect(res[0].title).toEqual("Modern art");
    });
});
