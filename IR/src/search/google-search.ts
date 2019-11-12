import fetch from 'node-fetch'

import { GoogleCustomSearchAPIKey, GoogleCustomSearchEngineId } from "../environment"
import { GoogleSearchResult } from "../models"


/**
 * Performs Google Search using the api keys defined in the environment (.env) file.
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
   * @param query The query to forward to Google.
   * @returns {Promise<GoogleSearchResult>} A Google Search result.
   */
  public queryCustom(query: string): Promise<GoogleSearchResult> {
    if (!query) throw "[Google Search] Error: empty query."
    return fetch(this.googleSearchUrls.custom + query)
      .then(googleRequest => googleRequest.json())
  }

  /**
   * Make a call to the RESTRICTED Google Search API.
   * The restricted api has no daily limits, but limited domains defined into the search engine context
   * @param query The query to forward to Google.
   * @returns {Promise<GoogleSearchResult>} A Google Search result.
   */
  public queryRestricted(query: string): Promise<GoogleSearchResult> {
    if (!query) throw "[Google Search] Error: empty query."
    return fetch(this.googleSearchUrls.restricted + query)
      .then(googleRequest => googleRequest.json())
  }

}