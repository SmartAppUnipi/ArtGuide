/// <reference types="@types/jest"/>

import { WikiData } from "../../src/wiki"


const wikidata = new WikiData()

describe("Wikidata", () => {

    it("Get Wikipedia page name from entityId ", async () => {
        const wikipediaPageTitle = await wikidata.getWikipediaName("/m/0cn46", "en");
        expect(wikipediaPageTitle).toBe("Leaning Tower of Pisa");
    });

});

describe("getProperties(freebaseId)", () => {

    it("Should return InstanceOf, Architect, ArchitecturalStyle", async () => {
        const properties = await wikidata["getProperties"]("/m/0cn46", "en"); // pisa tower
        expect(properties).toBeTruthy();
        expect(properties.Instanceof).toEqual(["Q200334","Q570116"]);
        expect(properties.Architect).toEqual(["Q892084"]);
        expect(properties.ArchitecturalStyle).toEqual(["Q46261"]);
        expect(properties.WikipediaPageTitle).toEqual("Leaning Tower of Pisa");
    });

});