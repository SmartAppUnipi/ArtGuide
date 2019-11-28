import { AdaptationEndpoint } from "../environment";
import { GoogleSearch } from "./google-search";
import logger from "../logger";
import { Parser } from "../parser";
import { post } from "../utils";
import {
    ClassificationResult,
    GoogleSearchResult,
    PageResult,
    Query,
    QueryExpansionResponse
} from "../models";

/**
 * Perform web searches.
 */
export class Search {

    /** Google Search service */
    private googleSearch = new GoogleSearch();

    /** Parser */
    private parser = new Parser();

    /**
     * Perform a web search.
     *
     * @param classificationResult The object received from the Classification module.
     * @returns {Promise<Array<PageResult>>} A list of page results.
     */
    public search(classificationResult: ClassificationResult): Promise<Array<PageResult>> {
        return this
            .buildQueries(classificationResult)
            .then(q => this.buildResult(q));
    }

    /**
     * Builds a basic query basing on the Classification module result.
     *
     * @param classificationResult The object received from the Classification module.
     * @returns {Array<Query>} An array of Query objects with searchTerms and score.
     */
    private buildBasicQueries(classificationResult: ClassificationResult): Array<Query> {
        // TODO: return a meaningful query
        const queries = classificationResult.classification.entities
            .slice(0, 3)  // take first 3 // TODO: slice using the first big jump on the score
            .map(entity => {
                return {
                    searchTerms: entity.description,
                    score: entity.score,
                    keywords: [],
                    language: classificationResult.userProfile.language
                };
            });
        if (!queries.length) logger.debug("[search.ts] Classification entities are empty");
        logger.silly("[search.ts] Basic query built: " + queries);
        return queries;
    }


    /**
     * Extend a query by using the query expansion provided by the Adaptation module.
     *
     * @param queries An array of Query produced by @function buildBasicQuery.
     * @param queryExpansion The query expansion provided by the Adaptation module.
     * @returns {Array<Query>} An array of object containing the originalQuery and an array expandedKeywords.
     */
    private extendQuery(queries: Array<Query>, queryExpansion: QueryExpansionResponse): Array<Query> {
        logger.silly("[search.ts] Query expansion: " + queryExpansion);
        const expandedQueries: Array<Query> = [];
        queries.forEach(query => {
            for (const key in queryExpansion.keywordExpansion)
                expandedQueries.push(Object.assign({}, query, { keywords: queryExpansion.keywordExpansion[key] }));
        });
        return expandedQueries;
    }


    /**
     * Build an array of queries using the query expansion provided by the Adaptation module.
     *
     * @param classificationResult The object received from the Classification module.
     * @returns {Promise<Array<Query>>} A promise resolved with the array of Query.
     */
    private buildQueries(classificationResult: ClassificationResult): Promise<Array<Query>> {
        // build the basic query using the Classification result
        const basicQueries = this.buildBasicQueries(classificationResult);
        // get the query expansion from the Adaptation module
        return post<QueryExpansionResponse>(
            AdaptationEndpoint.keywords, {
            userProfile: classificationResult.userProfile
        })
            // extend the basic query with the query expansion
            .then(queryExpansion => this.extendQuery(basicQueries, queryExpansion))
            // return both the basic query and the extended queries in one array
            .then(extendedQuery => basicQueries.concat(extendedQuery));
    }


    /**
     * Build a result object by querying Google Search the provided query.
     *
     * @param queries The buildQuery result.
     * @returns {Array<PageResult>} An array of page result to be sent to the Adaptation module.
     */
    private buildResult(queries: Array<Query>): Promise<Array<PageResult>> {

        const results: Array<PageResult> = [];

        return Promise.all(
            // for each query
            queries.map(async q => {
                // query Google Search and get the list of results
                return this.googleSearch
                    .queryCustom(q.searchTerms + " " + q.keywords.join(" "), q.language)
                    .then(queryResult => {

                        if (!queryResult) {
                            const err = new Error("Error: empty query result.");
                            logger.warn("[search.ts] ", err);
                            return;
                        }

                        if (!queryResult.items) {
                            logger.debug("[search.ts] No results for query " +
                                queryResult.queries.request[0].searchTerms);
                            return;
                        }

                        return this
                            .toPageResults(queryResult, q)
                            .then(pageResults => {

                                /*
                                 * TODO: Merge duplicates
                                 * For each basic query (eg. "Leaning Tower of Pisa") we perform a Google Search
                                 * for each keywords that come from the adaptation group
                                 * (eg. "Leaning Tower of Pisa Art", "Leaning Tower of Pisa Description", ecc).
                                 *
                                 * Each google search produces a set of pages that are actually merged regardless 
                                 * the fact they they could potentially be duplicated.
                                 *
                                 * We need to merge duplicated results, taking into account that we have to find a way
                                 * to merge their keywords and produce a a reasonable score index.
                                 */
                                results.push(...pageResults);
                            });
                    })
                    .catch(ex => {
                        logger.warn("[search.ts] Caught exception while processing query\"" + q + "\". Error: ", ex);
                    });
            })
        ).then(() => results);
    }

    /**
     * Makes a custom search on google using only the search terms provided, then converts back
     * the result to an array of PageResult. 
     * 
     * The keywords associated to the PageResult are the one provided by the query
     * since they cannot be inferred.
     * 
     * @param query The query with the keywords to search on Google.
     * @returns An array of PageResults.
     */
    public searchByTerms(query: Query): Promise<Array<PageResult>> {
        return this.googleSearch
            .queryCustom(query.searchTerms, query.language)
            .then(googleResult => this.toPageResults(googleResult, query));
    }

    /**
     * Given a GoogleSearchResult, for each returned item the parser gets invoked and
     * the text content of the corresponding page is inserted into a PageResult. 
     * 
     * Since the keywords that are associated to that google result cannot be inferred from the results themselves,
     * they must be explicitly passed by the caller.
     * 
     * @param googleResult The google search result.
     * @param keywords The keywords associated to the query that produced the google search result.
     * @returns The array of page results corresponding to the parsed pages returned from Google.
     */
    private async toPageResults(googleResult: GoogleSearchResult, query: Query): Promise<Array<PageResult>> {
        const results: Array<PageResult> = [];
        await Promise.all(
            googleResult.items.map((item, index, items) => {
                // Scrape text from results
                return this.parser.parse(item.link)
                    .then(pageResult => {
                        pageResult.keywords = query.keywords;
                        // TODO: assign a score multiplier read from config.json
                        pageResult.score = query.score + (1 - (index/items.length));
                        results.push(pageResult);
                        logger.silly("[search.ts] Parsed link " + item.link);
                    })
                    .catch(ex => {
                        logger.warn("[search.ts] Parser error: ", ex, ". Link: " + item.link);
                    });
            })
        );
        return results;
    }
}
