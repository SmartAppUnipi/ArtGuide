
import { CacheService } from "./cache.service";
import fetch from "node-fetch";
import { GoogleSearchConfig } from "../environment";
import { GoogleSearchResult } from "../models";
import logger from "../logger";

/**
 * Performs Google Search using the api keys defined in the environment (.env) file.
 */
export class GoogleSearch {

    /**
     * The Google Search REST APIs urls
     */
    private googleSearchUrls = {
        it: {
            // eslint-disable-next-line
            restricted: `https://www.googleapis.com/customsearch/v1/siterestrict?key=${GoogleSearchConfig.apiKey}&cx=${GoogleSearchConfig.searchEngineId.it}&q=`,
            // eslint-disable-next-line
            custom: `https://www.googleapis.com/customsearch/v1?key=${GoogleSearchConfig.apiKey}&cx=${GoogleSearchConfig.searchEngineId.it}&q=`
        },
        en: {
            // eslint-disable-next-line
            restricted: `https://www.googleapis.com/customsearch/v1/siterestrict?key=${GoogleSearchConfig.apiKey}&cx=${GoogleSearchConfig.searchEngineId.en}&q=`,
            // eslint-disable-next-line
            custom: `https://www.googleapis.com/customsearch/v1?key=${GoogleSearchConfig.apiKey}&cx=${GoogleSearchConfig.searchEngineId.en}&q=`
        }
    };

    /**
     * Performs Google Search using the api keys defined in the environment (.env) file.
     * 
     * @param cachePath The cache file path on disk. Default "google-cache.json" in root folder
     */
    constructor(public readonly cachePath: string = "google-cache.json") {

    }

    /**
     * The local cache service
     */
    private cacheService: CacheService = new CacheService(this.cachePath);


    /**
     * Make a call to the a specified Google Search API url.
     * This api searches the whole web but has a limit of 1k/day. After 5€/1k queries.
     *
     * @param googleSearchUrl Url of the Google Search API endpoint to be called.
     * @param query The query to forward to Google.
     * @param language The language to use as key in the cache.
     * @returns {Promise<GoogleSearchResult>} A Google Search result.
     * @throws {Error} if the error field is set on the API response.
     */
    private async query(googleSearchUrl: string, query: string, language: string): Promise<GoogleSearchResult> {
        if (!query)
            return Promise.resolve(null);

        const url = googleSearchUrl + query;
        const key = `[${language}]-` + url.split("&q=")[1];

        let queryResult = this.cacheService.get(key);

        if (queryResult === null) {
            // cache miss
            queryResult = await fetch(url)
                .then(res => res.json())
                .then(result => {
                    this.cacheService.set(key, result);
                    logger.debug("[google.ts] Cache insert.", { key });
                    return result;
                });
        } else {
            // cache hit
            logger.debug("[google.ts] Cache hit.", { key });
        }

        if (queryResult.error) {
            logger.warn("[google-search.ts] Google search returned error", { query, exception: queryResult.error });
            return null;
        }

        return queryResult;
    }

    /**
     * Make a call to the CUSTOM Google Search API.
     * This api searches the whole web but has a limit of 1k/day. After 5€/1k queries.
     *
     * @param query The query to forward to Google.
     * @param language The language to use in the results.
     * @returns {Promise<GoogleSearchResult>} A Google Search result.
     * @throws {Error} if the error field is set on the API response.
     */
    public queryCustom(query: string, language: string): Promise<GoogleSearchResult> {
        logger.debug("[google-search.ts] Making query to custom Google", { query: query, language: language });
        return this.query(this.googleSearchUrls[language as "it" | "en"].custom, query, language);
    }

    /**
     * Make a call to the RESTRICTED Google Search API.
     * The restricted api has no daily limits, but limited domains defined into the search engine context
     *
     * @param query The query to forward to Google.
     * @param language The language to use in the results.
     * @returns {Promise<GoogleSearchResult>} A Google Search result.
     * @throws {Error} if the error field is set on the API response.
     */
    public queryRestricted(query: string, language: string): Promise<GoogleSearchResult> {
        logger.debug("[google-search.ts] Making query to restricted Google", { query: query, language: language });
        return this.query(this.googleSearchUrls[language as "it" | "en"].restricted, query, language);
    }

}
