/// <reference types="@types/jest"/>

import { Wiki } from "../src/wiki"

const wiki = new Wiki()


describe("Function getWikiInfo", () => {
    test("it should return a Promise<PageResult>", async () => {

        const result = await wiki.getWikiInfo("mona lisa", "en");
        
        expect(result).toBeDefined();

        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('sections');
        expect(result).toHaveProperty('keywords');

        expect(result.title).toBeDefined();
        expect(result.url).toBeDefined();
        expect(result.keywords).toBeDefined();
        expect(result.sections).toHaveLength(14);
    });
});