import fetch from "node-fetch";
import fs from "fs";
import { GoogleSearchResult } from "../models";
import logger from "../logger";
import path from "path";
import {
    GoogleCustomSearchAPIKey,
    GoogleCustomSearchEngineId
} from "../environment";

/**
 * Performs Google Search using the api keys defined in the environment (.env) file.
 */
export class GoogleSearch {

    /**
     * The Google Search REST APIs urls
     */
    private googleSearchUrls = {
        // eslint-disable-next-line
        restricted: `https://www.googleapis.com/customsearch/v1/siterestrict?key=${GoogleCustomSearchAPIKey}&cx=${GoogleCustomSearchEngineId}&q=`,
        // eslint-disable-next-line
        custom: `https://www.googleapis.com/customsearch/v1?key=${GoogleCustomSearchAPIKey}&cx=${GoogleCustomSearchEngineId}&q=`
    };

    private cache = JSON.parse(fs.readFileSync(path.join(__dirname, "cache.json")).toString());

    /**
     * Make a call to the a specified Google Search API url.
     * This api searches the whole web but has a limit of 1k/day. After 5€/1k queries.
     * @param googleSearchUrl Url of the Google Search API endpoint to be called.
     * @param query The query to forward to Google.
     * @returns {Promise<GoogleSearchResult>} A Google Search result.
     * @throws {Error} if the error field is set on the API response.
     */
    private query(googleSearchUrl: string, query: string): Promise<GoogleSearchResult> {
        if (!query) {
            const err = new Error("Error: empty query.");
            logger.warn("[google.ts] ", err);
            return Promise.resolve(null);
        }
        return this.getFromCacheOrFetch(googleSearchUrl + query)
            .then(queryResult => {
                // Handle error in API result
                if (queryResult.error) {
                    const err = new Error(queryResult.error.message);
                    logger.error("[google.ts] Error in query \"" + query + "\". Query result error: ", err);
                    throw err;
                }
                return queryResult;
            });
    }

    /**
     * Make a call to the CUSTOM Google Search API.
     * This api searches the whole web but has a limit of 1k/day. After 5€/1k queries.
     * @param query The query to forward to Google.
     * @returns {Promise<GoogleSearchResult>} A Google Search result.
     * @throws {Error} if the error field is set on the API response.
     */
    public queryCustom(query: string): Promise<GoogleSearchResult> {
        return this.query(this.googleSearchUrls.custom, query);
    }

    /**
     * Make a call to the RESTRICTED Google Search API.
     * The restricted api has no daily limits, but limited domains defined into the search engine context
     * @param query The query to forward to Google.
     * @returns {Promise<GoogleSearchResult>} A Google Search result.
     * @throws {Error} if the error field is set on the API response.
     */
    public queryRestricted(query: string): Promise<GoogleSearchResult> {
        return this.query(this.googleSearchUrls.restricted, query);
    }

    /**
     * Fetch an url using a cache.
     * @param url The url to be fetched.
     * @returns {Promise<GoogleSearchResult>} The cached or fetched GoogleSearchResult corresponding to that url.
     */
    private getFromCacheOrFetch(url: string): Promise<GoogleSearchResult> {
        const keywords = url.split("&q=")[1];
        if (this.cache[keywords]) {
            logger.debug("[google.ts] Cache hit:" + keywords);
            return Promise.resolve(this.cache[keywords]);
        }
        return fetch(url)
            .then(res => res.json())
            .then(json => {
                this.cache[keywords] = json;
                fs.writeFileSync(path.join(__dirname, "cache.json"), JSON.stringify(this.cache));
                logger.debug("[google.ts] Cache insert: " + url);
                return this.cache[keywords];
            });
    }

}
