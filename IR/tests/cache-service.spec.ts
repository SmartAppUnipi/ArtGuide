/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

import { CacheService } from '../src/search/cache.service';
import fs from "fs";

describe("Cache service", () => {

    it("Should create a new cache", () => {
        const cachePath = "tmpCache.json";
        const cacheService = new CacheService(cachePath);
        expect(fs.existsSync(cachePath)).toEqual(true);
        cacheService.initialize();

    });

    it("Should delete the cache on initialize", () => {
        const cachePath = "tmpCache.json";
        const cacheService = new CacheService(cachePath);
        expect(fs.existsSync(cachePath)).toEqual(true);
        cacheService.initialize();
        expect(fs.existsSync(cachePath)).toEqual(false);
    });

    it("Should write on disk", () => {
        const cachePath = "tmpCache.json";
        const cacheService = new CacheService(cachePath);

        cacheService.set("myKey", { message: "Disk" });

        const cacheContent = JSON.parse(fs.readFileSync(cachePath).toString());
        expect(cacheContent).toEqual({ myKey: { message: "Disk" } });

        cacheService.initialize();
    });

    it("Should read from disk", () => {

        const cachePath = "tmpCache.json";
        const existingCache = { myKey: { message: "Existing cache" } };
        fs.writeFileSync(cachePath, JSON.stringify(existingCache));

        const cacheService = new CacheService(cachePath);
        const myKey = cacheService.get("myKey");
        expect(myKey.message).toEqual("Existing cache");

        cacheService.initialize();
    });

})