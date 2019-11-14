import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

import { logger } from '../logger'
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

  private cache = JSON.parse(fs.readFileSync(path.join(__dirname, 'cache.json')).toString())

  /**
   * Fetch an url using a cache.
   * @param url The url to be fetched.
   * @returns {Promise<GoogleSearchResult>} The cached or fetched GoogleSearchResult corresponding to that url.
   */
  private async getFromCacheOrFetch(url: string): Promise<GoogleSearchResult> {
    const keywords = url.split('&q=')[1]
    if (this.cache[keywords]) {
      logger.debug('[google.ts] Cache hit:' + keywords)
      return Promise.resolve(this.cache[keywords])
    }
    return fetch(url)
      .then(res => res.json())
      .then(json => {
        this.cache[keywords] = json;
        fs.writeFileSync(path.join(__dirname, 'cache.json'), JSON.stringify(this.cache))
        logger.debug('[google.ts] Cache insert: ' + url)
        return this.cache[keywords]
      })

  }

  /**
   * Make a call to the CUSTOM Google Search API.
   * This api searches the whole web but has a limit of 1k/day. After 5€/1k queries.
   * @param query The query to forward to Google.
   * @returns {Promise<GoogleSearchResult>} A Google Search result.
   * @throws {Error} if the Google Search result contains error.
   */
  public queryCustom(query: string): Promise<GoogleSearchResult> {
    // Handle empty queries
    if (!query) {
      const err = new Error("Error: empty query.")
      logger.warn('[google.ts] ', err)
      return Promise.resolve(null)
    }
    return this.getFromCacheOrFetch(this.googleSearchUrls.custom + query)
      .then(queryResult => {
        // Handle error in API result
        if (queryResult.error) {
          const err = new Error(queryResult.error.message)
          logger.error('[google.ts] Error in query \"' + query + '\". Query result error: ', err)
          throw err
        }
        return queryResult
      })
  }

  /**
   * Make a call to the RESTRICTED Google Search API.
   * The restricted api has no daily limits, but limited domains defined into the search engine context
   * @param query The query to forward to Google.
   * @returns {Promise<GoogleSearchResult>} A Google Search result.
   */
  public queryRestricted(query: string): Promise<GoogleSearchResult> {
    if (!query) {
      const err = new Error("[Google Search] Error: empty query.")
      logger.warn('[google.ts] Empty query: ', err)
      return Promise.resolve(null)
    }
    return this.getFromCacheOrFetch(this.googleSearchUrls.restricted + query)
  }

}