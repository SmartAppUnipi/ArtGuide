import { GoogleCustomSearchAPIKey, GoogleCustomSearchEngineId } from "../environment";
import fetch from 'node-fetch';
import { GoogleSearchResult } from "../models";

/**
 * Performs Google Search using the api keys defined in the environment (.env) file
 */
export class GoogleSearch {

    /**
     * The Google Search REST APIs urls
     */
    private googleSearchUrls = {
        restricted: `https://www.googleapis.com/customsearch/v1/siterestrict?key=${GoogleCustomSearchAPIKey}&cx=${GoogleCustomSearchEngineId}&q=`,
        custom: `https://www.googleapis.com/customsearch/v1?key=${GoogleCustomSearchAPIKey}&cx=${GoogleCustomSearchEngineId}&q=`
    }

    /**
     * Make a call to the CUSTOM Google Search API.
     * This api searches the whole web but has a limit of 1k/day. After 5€/1k queries.
     * @param query The query to forward to Google
     */
    public async queryCustom(query: string): Promise<GoogleSearchResult> {
        const googleRequest = await fetch(this.googleSearchUrls.custom + query);
        return googleRequest.json();
    }

    /**
     * Make a call to the RESTRICTED Google Search API.
     * The restricted api has no daily limits, but limited domains defined into the search engine context
     * @param query The query to forward to Google
     */
    public async queryRestricted(query: string): Promise<GoogleSearchResult> {
        const googleRequest = await fetch(this.googleSearchUrls.restricted + query);
        return googleRequest.json();
    }

}