/// <reference types="@types/jest"/>

import { reduceEntities } from "../../src/utils"
import { Entity } from "../../src/models";

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
] as Array<Entity>;

describe("reduceEntities", () => {

    it("Should cut on the biggest jump between scores", () => {
        const result = reduceEntities(entities)
        expect(result.length).toBeLessThanOrEqual(7)
        expect(result[result.length - 1].score).toEqual(0.54)
    })

    it("Must take into account the max length admitted", () => {
        const result = reduceEntities(entities, 6)
        expect(result.length).toBeLessThanOrEqual(6)
        expect(result.length).toEqual(6)
        expect(result[result.length - 1].score).toEqual(0.55)
    })

    it("Must take into account the minimum score", () => {
        const result = reduceEntities(entities, entities.length, 0.82)
        expect(result[result.length - 1].score).toBeGreaterThanOrEqual(0.82)
        expect(result.length).toBeLessThanOrEqual(2)
        expect(result[result.length - 1].score).toEqual(0.95)
    })
})

describe("fuzzy", () => {
    test("null array", () => {
        const result = reduceEntities(null)
        expect(result).toBeNull()
    })

    test("empty array", () => {
        const result = reduceEntities([])
        expect(result).toHaveLength(0)
        expect(result).toEqual([])
    })

    test("null numbers", () => {
        const result = reduceEntities(entities, null, null)
        expect(result.length).toBeGreaterThan(0)
        expect(result).toHaveLength(7)
    })

    test("negative numbers", () => {
        const result = reduceEntities(entities, -1, -1)
        expect(result.length).toBeGreaterThan(0)
        expect(result).toHaveLength(7)
    })

    test("array with null value", () => {
        const result = reduceEntities([null, ...entities])
        expect(result).toHaveLength(8)
    })

    test("array of only null values", () => {
        const result = reduceEntities([null, null, null])
        expect(result).toHaveLength(0)
        expect(result).toEqual([])
    })
})
