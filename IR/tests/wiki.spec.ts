//import '@types/jest'
import request from 'supertest'
import { Wiki} from "../src/wiki"

const wiki = new Wiki()


describe("Function getWikiInfo", () =>{
    test("it should return a Promise<PageResult>", ()=>{
        expect(wiki.getWikiInfo("mona lisa", "en")).resolves.toHaveProperty('url');
        expect(wiki.getWikiInfo("mona lisa", "en")).resolves.toHaveProperty('title');
        expect(wiki.getWikiInfo("mona lisa", "en")).resolves.toHaveProperty('sections');
        expect(wiki.getWikiInfo("mona lisa", "en")).resolves.toHaveProperty('keywords');
    });
});