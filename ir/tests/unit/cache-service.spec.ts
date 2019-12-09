/// <reference types="@types/jest"/>
/// <reference types="@types/node"/>

import { CacheService } from '../../src/search/cache.service';
import fs from "fs";

describe("Cache service", () => {

    it("Should create a new cache", () => {
        const cachePath = "tmpCache.json";
        const cacheService = new CacheService(cachePath);
        expect(fs.existsSync(cachePath)).toEqual(true);
        cacheService.reset();

    });

    it("Should delete the cache on initialize", () => {
        const cachePath = "tmpCache.json";
        const cacheService = new CacheService(cachePath);
        expect(fs.existsSync(cachePath)).toEqual(true);
        cacheService.reset();
        expect(fs.existsSync(cachePath)).toEqual(false);
    });

    it("Should write on disk", () => {
        const cachePath = "tmpCache.json";
        const cacheService = new CacheService(cachePath);

        const success = cacheService.set("myKey", { message: "Disk" });
        expect(success).toBeTruthy();

        const cacheContent = JSON.parse(fs.readFileSync(cachePath).toString());
        expect(cacheContent).toEqual({ myKey: { message: "Disk" } });

        cacheService.reset();
    });

    it("Should read from disk", () => {
        const cachePath = "tmpCache.json";
        const existingCache = { myKey: { message: "Existing cache" } };
        fs.writeFileSync(cachePath, JSON.stringify(existingCache));

        const cacheService = new CacheService(cachePath);
        const myKey = cacheService.get("myKey");
        expect(myKey.message).toEqual("Existing cache");

        cacheService.reset();
    });

    it("Should return null if the key is not in cache", () => {
        const cachePath = "tmpCache.json";
        const cacheService = new CacheService(cachePath);
        const myKey = cacheService.get("notCachedKey");
        expect(myKey).toBeNull();
        cacheService.reset();
    });

})