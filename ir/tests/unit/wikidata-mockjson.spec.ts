/// <reference types="@types/jest"/>

// Mock config.json before import WikiData
jest.mock('../../config.json', () => ({
    wikidataProperties: {
        instanceof: "P31",
        testProp: "12345"
    }
}));

import { WikiData } from "../../src/wiki"
import { Entity } from "../../src/models";


describe("getProperties(freebaseId)", () => {
    it("Should return all properties from config.json", async () => {
        const _wikidata = new WikiData()
        const properties = await _wikidata.getProperties({ entityId: "/m/0cn46" } as Entity, "en"); // pisa tower
        expect(properties).toBeTruthy();
        expect(Object.keys(properties).length).toEqual(5);
        expect(properties.instanceof).toEqual(["Q200334", "Q570116"]);
        expect((properties as any).testProp).toEqual([]);
    });
});

