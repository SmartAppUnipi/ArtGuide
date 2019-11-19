import fs from "fs";

/**
 * A cache service that writes on disk.
 */
export class CacheService {

    private cache: { [key: string]: any };


    /**
     * Create a new cache service that writes on disk. 
     * 
     * @param cachePath The path to the cache file on disk
     */
    constructor(public readonly cachePath: string) {

        if (!fs.existsSync(this.cachePath))
            fs.writeFileSync(this.cachePath, {});

        const content = fs.readFileSync(this.cachePath).toString();
        try {
            this.cache = JSON.parse(content);
        } catch {
            this.cache = {};
        }
    }

    /**
     * Get an item from the cache if it exists. Return null otherwise.
     * 
     * @param key The cache key
     * @returns The item value or null.
     */
    public get<T = any>(key: string): T {
        return this.cache[key] || null;
    }

    /**
     * Set or replace an item at a given key. Return true if the 
     * item has been written on the disk, false otherwise.
     * 
     * @param key The cache key
     * @param item The item to set at that key
     * @returns true if the cache has been written on file, false otherwise
     */
    public set<T>(key: string, item: T): boolean {

        const newCache = Object.assign({}, this.cache);
        newCache[key] = item;

        try {
            fs.writeFileSync(this.cachePath, JSON.stringify(newCache));
            this.cache[key] = item;
        } catch (ex) {
            return false;
        }

        return true;
    }

    /**
     * Deletes the cache file form disk and empty the in-memory cache
     */
    public reset(): void {
        fs.unlinkSync(this.cachePath);
        this.cache = {};
    }
}