/// <reference types="@types/jest"/>

import wikijs from "wikijs";
import { WikiData } from "../src/wiki"
import { WikiDataFields } from "../src/models";

const wikidata = new WikiData()


describe("Wikidata", () => {
    it("Should return simplified claims", async () => {

        const id = "/m/0cn46" // pisa tower

        const res: WikiDataFields = await wikidata.getSimplifiedClaims(id)

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

describe("WikiData.getEntityRootPath(entityId)",()=>{
    
    const _wikidata = new WikiData()

    it("Should return the tree of InstanceOf/SubClassOf of Pisa Tower", async () => {

        const PisaTowerTree = await _wikidata.getEntityRootPath("Q39054");

        expect(PisaTowerTree).toBeTruthy();
        expect(PisaTowerTree.length).toBeGreaterThan(0);

        expect(PisaTowerTree).toContain("tourist attraction")       // Level 1
        expect(PisaTowerTree).toContain("bell tower")
        expect(PisaTowerTree).toContain("tower")                    // Level 2
        expect(PisaTowerTree).toContain("architectural structure")  // Level 3
    });

    it("Should return the tree of InstanceOf/SubClassOf of Mona Lisa", async () => {

        const monaLisaTree = await _wikidata.getEntityRootPath("Q12418");

        expect(monaLisaTree).toBeTruthy();
        expect(monaLisaTree.length).toBeGreaterThan(0);

        expect(monaLisaTree).toContain("painting")                              // Level 1
        expect(monaLisaTree).toContain("visual artwork")                        // Level 2
        expect(monaLisaTree).toContain("work of art")                           // Level 3
        expect(monaLisaTree).toContain("item of collection or exhibition")
    });

    it("Should not include the entityId", async () => {
        const entityId = "Q39054"
        const PisaTowerTree = await _wikidata.getEntityRootPath(entityId);

        expect(PisaTowerTree).not.toContain(entityId);
    });

    it("Should return [] if an invalid entity is provided", async () => {
        const tree = await _wikidata.getEntityRootPath("NotValidEntityId");
        expect(tree).toEqual([]);
    });
});