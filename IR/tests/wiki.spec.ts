/// <reference types="@types/jest"/>

import { Wiki } from "../src/wiki/wiki2"
import wiki from 'wikijs';

const wikijs = new Wiki()

/*  describe("Infobox content", () => {
    test("Let's see what's inside the infobox", async () => {
        return wiki().findById("Q39054").then(page => page.content().then(info => console.log(info)))
        .catch(err =>
            console.log("ERROREEEEEE!!"+err));

        //console.log(info);
    });
});
  */

describe("Function getWikiInfo", () => {
    test("it should return a Promise<PageResult>", async () => {

        const result = await wikijs['getWikiInfo']("mona lisa", "en");
        
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