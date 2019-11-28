/// <reference types="@types/jest"/>

import { WikiData } from "../src/wiki"


const wikidata = new WikiData()

describe("Wikidata", () => {

    it("Get Wikipedia page name from entityId ", async () => {
        const wikipediaPageTitle = await wikidata.getWikipediaName("/m/0cn46", "en");
        expect(wikipediaPageTitle).toBe("Leaning Tower of Pisa");
    });

});