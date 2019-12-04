/// <reference types="@types/jest"/>

import { WikiData } from "../../src/wiki"
import { ClassificationResult } from "../../src/models";


const wikidata = new WikiData()

describe("Get Wikipedia page name from entityId", () => {
    it("Should return the correct page title", async () => {
        const wikipediaPageTitle = await wikidata.getWikipediaName("/m/0cn46", "en");
        expect(wikipediaPageTitle).toBe("Leaning Tower of Pisa");
    });
});


describe("Look for known instance", () => {
    it("Works with a single recognized entity", async () => {
        const entities = [
            {   // bicycle
                entityId: "/m/0199g",
                score: 1
            },
            {   // Leaning Tower of Pisa
                entityId: "/m/0cn46",
                score: 1
            },
            {   // tower
                entityId: "/m/01fdzj",
                score: 1
            }
        ];
        const classificationResult = {
            userProfile: { language: "en" },
            classification: { entities: entities }
        }
        const knownInstance = await wikidata.tryGetKnownInstance(classificationResult as ClassificationResult);
        expect(knownInstance).toBeDefined();
        expect(knownInstance.WikipediaPageTitle).toBe("Leaning Tower of Pisa")
    });

    it("Return the entity with the highest score", async () => {
        const entities = [
            {   // Mona Lisa
                entityId: "/m/0jbg2",
                score: 0.5
            },
            {   // Leaning Tower of Pisa
                entityId: "/m/0cn46",
                score: 0.87
            },
            {   // tower
                entityId: "/m/01fdzj",
                score: 1
            }
        ];
        const classificationResult = {
            userProfile: { language: "en" },
            classification: { entities: entities }
        }
        const knownInstance = await wikidata.tryGetKnownInstance(classificationResult as ClassificationResult);
        expect(knownInstance).toBeDefined();
        expect(knownInstance.WikipediaPageTitle).toBe("Leaning Tower of Pisa")
    });

    it("Return null if there isn't a known entity", async () => {
        const entities = [
            {   // bicycle
                entityId: "/m/0199g",
                score: 1
            },
            {   // tower
                entityId: "/m/01fdzj",
                score: 1
            }
        ];
        const classificationResult = {
            userProfile: { language: "en" },
            classification: { entities: entities }
        }
        const knownInstance = await wikidata.tryGetKnownInstance(classificationResult as ClassificationResult);
        expect(knownInstance).toBeNull();
    });
});


describe("getProperties(freebaseId)", () => {
    it("Should return InstanceOf, Architect, ArchitecturalStyle", async () => {
        const properties = await wikidata["getProperties"]("/m/0cn46", "en"); // pisa tower
        expect(properties).toBeTruthy();
        expect(properties.Instanceof).toEqual(["Q200334", "Q570116"]);
        expect(properties.Architect).toEqual(["Q892084"]);
        expect(properties.ArchitecturalStyle).toEqual(["Q46261"]);
        expect(properties.WikipediaPageTitle).toEqual("Leaning Tower of Pisa");
    });
});

describe("getEntityRootPath(entityId)", () => {

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