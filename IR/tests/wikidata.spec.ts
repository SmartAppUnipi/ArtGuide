/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>


import fetch from "node-fetch";
import wikijs from "wikijs";
import { WikiData } from "../src/wikidata"
import { WikiDataFields } from "../src/models";

const wikidata = new WikiData()


describe("Wikidata", () => {
    it("Should return simplified claims", async () => {

        const id = "/m/0cn46" // pisa tower

        const res : WikiDataFields = await wikidata.getSimplifiedClaims(id)

        expect(res.Instanceof).toEqual(["Q200334", "Q570116"]);
        expect(res.Creator).toEqual([]);

    });

    it("Should return Wikipedia name from Wikidata id", async () => {

        const wikidataId = "Q39054"; // pisa tower

        const lang = "en";

        const wikipediaPageTitle = await wikidata.getWikipediaName(lang, wikidataId);

        const page = await wikijs().find(wikipediaPageTitle);

        expect(wikipediaPageTitle).toBe("Leaning Tower of Pisa");
    });
});