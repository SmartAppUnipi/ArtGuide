/// <reference types="@types/jest"/>

import { reduceEntities } from "../src/utils"
import { BasicFieldWithId } from "../src/models/classification.models";

describe("Utility functions", () => {

    describe("reduceEntities", () => {

        const entities = [
            { score: 0.99 },
            { score: 0.95 },
            { score: 0.85 },
            { score: 0.80 },
            { score: 0.60 },
            { score: 0.55 },
            { score: 0.54 },
            { score: 0.17 },
            { score: 0.10 },
            { score: 0.03 },
            { score: 0.01 },
        ] as Array<BasicFieldWithId>;

        it("Should cut on the biggest jump between scores", () => {
            let result = reduceEntities(entities)
            expect(result[result.length - 1].score).toEqual(0.54)
        })

        it("Must take into account the max length admitted", () => {
            let result = reduceEntities(entities, 6)
            expect(result.length).toBeLessThanOrEqual(6)
            expect(result[result.length - 1].score).toEqual(0.80)
        })

        it("Must take into account the minimum score", () => {
            let result = reduceEntities(entities, entities.length, 0.82)
            expect(result[result.length - 1].score).toBeGreaterThanOrEqual(0.82)
            expect(result[result.length - 1].score).toEqual(0.95)
        })
    })
})