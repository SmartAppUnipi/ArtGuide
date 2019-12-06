/// <reference types="@types/jest"/>

import { WikiData } from "../../src/wiki"
import { ClassificationResult, Entity } from "../../src/models";
import { MetaEntity } from "../../src/models";


const wikidata = new WikiData()


describe("Get Wikipedia page name from entityId", () => {
    it("Should return the correct page title", async () => {
        const wikipediaPageTitle = await wikidata.getWikipediaName("Q39054", "en");
        expect(wikipediaPageTitle).toBe("Leaning Tower of Pisa");
    });
});


describe("Look for known instance", () => {
    it("Works with a single recognized entity", async () => {
        const entities = [
            {   // bicycle
                entityId: "/m/0199g",
            },
            {   // Leaning Tower of Pisa
                entityId: "/m/0cn46",
            },
            {   // tower
                entityId: "/m/01fdzj",
            }
        ] as Array<Entity>;
        return Promise.all(entities.map(entity => wikidata.getProperties(entity, "en")))
            .then(async metaEntities => {
                const knownInstance = await wikidata.tryGetKnownInstance(metaEntities, "en");
                expect(knownInstance).toBeDefined();
                expect(knownInstance.entityId).toBe("/m/0cn46") // Leaning Tower of Pisa
            })
    });

    it("Return the first recognized entity", async () => {
        const entities = [
            {   // Leaning Tower of Pisa
                entityId: "/m/0cn46",
            },
            {   // Mona Lisa
                entityId: "/m/0jbg2",
            },
            {   // tower
                entityId: "/m/01fdzj",
            }
        ] as Array<Entity>;
        return Promise.all(entities.map(entity => wikidata.getProperties(entity, "en")))
            .then(async metaEntities => {
                const knownInstance = await wikidata.tryGetKnownInstance(metaEntities, "en");
                expect(knownInstance).toBeDefined();
                expect(knownInstance.entityId).toBe("/m/0cn46") // Leaning Tower of Pisa
            })
    });

    it("Return null if there isn't a known entity", async () => {
        const entities = [
            {   // bicycle
                entityId: "/m/0199g",
            },
            {   // tower
                entityId: "/m/01fdzj",
            }
        ] as Array<Entity>;
        return Promise.all(entities.map(entity => wikidata.getProperties(entity, "en")))
            .then(async metaEntities => {
                const knownInstance = await wikidata.tryGetKnownInstance(metaEntities, "en");
                expect(knownInstance).toBeNull();
            })
    });
});


describe("getProperties(freebaseId)", () => {
    it("Should return InstanceOf, Architect, ArchitecturalStyle", async () => {
        const properties = await wikidata["getProperties"]({ entityId: "/m/0cn46" } as Entity, "en"); // pisa tower
        expect(properties).toBeTruthy();
        expect(properties.instanceof).toEqual(["Q200334", "Q570116"]);
        expect(properties.architect).toEqual(["Q892084"]);
        expect(properties.architecturalStyle).toEqual(["Q46261"]);
        expect(properties.wikipediaPageTitle).toEqual("Leaning Tower of Pisa");
    });
});


describe("getEntityRootPath(entityId)", () => {

    it("Should return the tree of InstanceOf/SubClassOf of Pisa Tower", async () => {

        const PisaTowerTree = await wikidata['getEntityRootPath']("Q39054");

        expect(PisaTowerTree).toBeTruthy();
        expect(PisaTowerTree.length).toBeGreaterThan(0);

        expect(PisaTowerTree).toContain("tourist attraction")       // Level 1
        expect(PisaTowerTree).toContain("bell tower")
        expect(PisaTowerTree).toContain("tower")                    // Level 2
        expect(PisaTowerTree).toContain("architectural structure")  // Level 3
    });

    it("Should return the tree of InstanceOf/SubClassOf of Mona Lisa", async () => {

        const monaLisaTree = await wikidata['getEntityRootPath']("Q12418");

        expect(monaLisaTree).toBeTruthy();
        expect(monaLisaTree.length).toBeGreaterThan(0);

        expect(monaLisaTree).toContain("painting")                              // Level 1
        expect(monaLisaTree).toContain("visual artwork")                        // Level 2
        expect(monaLisaTree).toContain("work of art")                           // Level 3
        expect(monaLisaTree).toContain("item of collection or exhibition")
    });

    it("Should not include the entityId", async () => {
        const entityId = "NotValidId";
        const PisaTowerTree = await wikidata['getEntityRootPath'](entityId);
        expect(PisaTowerTree).not.toContain(entityId);
    });

    it("Should return [] if an invalid entity is provided", async () => {
        const tree = await wikidata['getEntityRootPath']("NotValidEntityId");
        expect(tree).toEqual([]);
    });
});


describe("filterNotArtRelatedResult", () => {
    const entities = [
        {
            description: "bicycle",
            entityId: "/m/0199g",
        },
        {
            description: "Leaning Tower of Pisa",
            entityId: "/m/0cn46"
        },
        {
            description: "Painting",
            entityId: "/m/05qdh"
        },
        {
            description: "Renzo Piano",
            entityId: "/m/06gpm"
        },
        {
            description: "Santa Maria della Spina",
            entityId: "/m/094yj5"
        },
        {
            description: "house",
            entityId: "/m/03jm5"
        },
        {
            description: "Mona Lisa",
            entityId: "/m/0jbg2"
        },
        {
            description: "crowd",
            entityId: "/m/03qtwd"
        }
    ] as Array<MetaEntity>

    it("Should remove entities not related to arts", async () => {
        return Promise.all(entities.map(entity => wikidata.getProperties(entity, "en")))
            .then(metaEntities => {
                wikidata.filterNotArtRelatedResult(metaEntities)
                    .then(filtered => {
                        expect(filtered).not.toContain(metaEntities[0]) // bicycle
                        expect(filtered).toContain(metaEntities[1]) // Leaning Tower of Pisa
                        expect(filtered).toContain(metaEntities[2]) // Painting
                        expect(filtered).toContain(metaEntities[3]) // Renzo Piano
                        expect(filtered).toContain(metaEntities[4]) // Santa Maria della Spina
                        expect(filtered).not.toContain(metaEntities[5]) // house
                        expect(filtered).toContain(metaEntities[6]) // Mona Lisa
                        expect(filtered).not.toContain(metaEntities[7]) // crowd
                        expect(filtered).toHaveLength(5)
                    })
            })
    })
})

describe("setWikipediaNames()", () => {

    it("Should populate wikidata id with names", async () => {
        const _wikidata = new WikiData();
        const metaEntity = await wikidata["getProperties"]({ entityId: "/m/0cn46" } as Entity, "en"); // pisa tower

        expect(metaEntity.architect).toEqual(["Q892084"]);
        // expect(metaEntity.instanceof).toEqual(["Q200334", "Q570116"]);

        const populatedMetaEntity = await _wikidata["setWikipediaNames"](metaEntity, "en");

        expect(populatedMetaEntity.architect).toEqual(["Bonanno Pisano"]);
        // expect(populatedMetaEntity.instanceof).toEqual(["bell tower", "tourist attraction"]);
    });
});