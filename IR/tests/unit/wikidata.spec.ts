/// <reference types="@types/jest"/>

import { WikiData } from "../../src/wiki"
import { ClassificationResult } from "../../src/models";


const wikidata = new WikiData()

describe("Wikidata", () => {

    test("Get Wikipedia page name from entityId ", async () => {
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
        const knownInstance = await wikidata.getKnownInstance(classificationResult as ClassificationResult);
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
        const knownInstance = await wikidata.getKnownInstance(classificationResult as ClassificationResult);
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
        const knownInstance = await wikidata.getKnownInstance(classificationResult as ClassificationResult);
        expect(knownInstance).toBeNull();
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