import { Adaptation } from "../adaptation";
import { GoogleSearch } from "./google-search";
import logger from "../logger";
import { Parser } from "../parser";
import {
    GoogleSearchResult,
    MetaEntity,
    PageResult,
    Query,
    QueryExpansionResponse,
    UserProfile
} from "../models";
import { knownInstanceProperties, scoreWeight, searchBlackList } from "../../config.json";


interface ParsableItem extends Query {
    url: string;
    keywords: Array<string>;
    score: number;
}

interface QueryResult {
    gResult: GoogleSearchResult;
    query: Query;
}


/**
 * Perform web searches.
 */
export class Search {

    /** Google Search service */
    private googleSearch = new GoogleSearch();

    /** Parser */
    private parser = new Parser();

    /** Adaptation interface */
    private adaptation = new Adaptation();

    /**
     * Perform a web search.
     *
     * @param metaEntities The entities with WikiData properties.
     * @param userProfile The user profile for the keyword expansion query.
     * @returns A list of page results.
     */
    public search(metaEntities: Array<MetaEntity>, userProfile: UserProfile): Promise<Array<PageResult>> {
        return this
            .buildQueries(metaEntities, userProfile)
            .then(queries => this.buildResult(queries, userProfile));
    }

    /**
     * Builds a basic query basing on the Classification module result.
     *
     * @param metaEntities The entities with WikiData properties.
     * @param language The language to be used for the query.
     * @returns An array of Query objects with searchTerms and score.
     */
    private buildBasicQueries(metaEntities: Array<MetaEntity>, language: string): Array<Query> {
        const queries = metaEntities
            .map(metaEntity => {
                return {
                    entityId: metaEntity?.entityId ?? metaEntity?.wikidataId,
                    searchTerms: metaEntity.wikipediaPageTitle,
                    score: metaEntity.score,
                    keywords: [],
                    language: language
                };
            });
        if (!queries.length) logger.debug("[search.ts] Classification entities are empty");
        logger.silly("[search.ts] Basic query built", { queries });
        return queries;
    }


    /**
     * Extend a query by using the query expansion provided by the Adaptation module.
     *
     * @param queries An array of Query produced by @function buildBasicQuery.
     * @param queryExpansion The query expansion provided by the Adaptation module.
     * @returns An array of object containing the originalQuery and an array expandedKeywords.
     */
    private extendQuery(queries: Array<Query>, queryExpansion: QueryExpansionResponse): Array<Query> {
        logger.silly("[search.ts] Query expansion request", { queryExpansion });
        const expandedQueries: Array<Query> = [];
        queries.forEach(query => {
            for (const key in queryExpansion.keywordExpansion)
                expandedQueries.push(Object.assign({}, query, { keywords: queryExpansion.keywordExpansion[key] }));
            expandedQueries.push(query);
        });
        logger.silly("[search.ts] Expanded queries", { queryExpansion });

        return expandedQueries;
    }


    /**
     * Build an array of queries using the query expansion provided by the Adaptation module.
     *
     * @param metaEntities The entities with WikiData properties.
     * @param userProfile The user profile for the query expansion.
     * @returns A promise resolved with the array of Query.
     */
    private buildQueries(metaEntities: Array<MetaEntity>, userProfile: UserProfile): Promise<Array<Query>> {
        // build the basic query using the Classification result
        const basicQueries = this.buildBasicQueries(metaEntities, userProfile.language);
        // get the query expansion from the Adaptation module
        return this.adaptation.getKeywordExpansion(userProfile)
            // extend the basic query with the query expansion
            .then(queryExpansion => this.extendQuery(basicQueries, queryExpansion));
    }


    /**
     * Build a result object by querying Google Search the provided query.
     *
     * @param queries The buildQuery result.
     * @param userProfile The user profile containing language and expertise level.
     * @returns An array of page result to be sent to the Adaptation module.
     */
    private buildResult(queries: Array<Query>, userProfile: UserProfile): Promise<Array<PageResult>> {

        return Promise.all(
            // for each query
            queries.map(query => {
                // query Google Search and get the list of results
                return this.googleSearch
                    .query(query.searchTerms + " " + query.keywords.join(" "), userProfile)
                    .then(googleSearchResult => {

                        if (!googleSearchResult || !googleSearchResult.items) {
                            logger.warn("[search.ts] Google returned no items for query.", { query: query });
                            return;
                        }

                        return {
                            gResult: googleSearchResult,
                            query: query
                        };
                    })
                    .catch(ex => {
                        logger.error("[search.ts] Caught exception while processing a query.",
                                     { query: query, exception: ex });
                        return null;
                    });
            })
        )
            // remove null values
            .then(gResults => gResults.filter(gResult => gResult))
            // merge duplicate
            .then(gResults => this.mergeDuplicateUrls(gResults))
            // filter blacklist
            .then(parsableItems => parsableItems
                .filter(result =>
                    !searchBlackList.some(blackListWebsite => result.url.includes(blackListWebsite))))
            // call the parser
            .then(parsableItems => this.parseList(parsableItems));
    }

    /**
     * Makes a custom search on google using only the search terms provided, then converts back
     *the result to an array of PageResult.
     *
     *The keywords associated to the PageResult are the one provided by the query
     *since they cannot be inferred.
     *
     * @param knownInstance The non-null KnownInstance object.
     * @param userProfile The user profile for the adaptation module.
     * @returns An array of PageResults.
     */
    public async searchKnownInstance(knownInstance: MetaEntity, userProfile: UserProfile): Promise<Array<PageResult>> {
        const queries: Array<Query> = [];
        // search for the entity
        queries.push({
            entityId: knownInstance?.entityId ?? knownInstance?.wikidataId,
            language: userProfile.language,
            searchTerms: knownInstance.wikipediaPageTitle,
            keywords: [],
            score: knownInstance.score
        });
        // search for the properties
        const propertyScore = knownInstance.score * scoreWeight.known.wikidataProperty;
        for (const property of knownInstanceProperties) {
            for (const value of knownInstance[property]) {
                queries.push({
                    entityId: knownInstance?.entityId ?? knownInstance?.wikidataId,
                    language: userProfile.language,
                    searchTerms: value,
                    keywords: [],
                    score: propertyScore
                });
            }
        }

        return this.adaptation.getKeywordExpansion(userProfile)
            // extend the basic query with the query expansion
            .then(queryExpansion => this.extendQuery(queries, queryExpansion))
            .then(queries => this.buildResult(queries, userProfile));
    }

    /**
     * Merges the google duplicates urls into a single object with he merged keywords.
     * 
     * @param results The array of results from Google with the 
     * associated query that contains the search terms and the
     * keywords that generated that results.
     * 
     * @returns The list of URLS without duplicates, with the associated keywords and score.
     */
    private mergeDuplicateUrls(results: Array<QueryResult>): Array<ParsableItem> {

        const linkMap = new Map<string, ParsableItem>();
        const finalResult: Array<ParsableItem> = [];

        /*
         * Create a Map and if link is not there, append it to a map together with its keywords
         * if link is already in the map, then take from the Map old values of keywords,
         * concatenate them with the new values and append everything to a Map 
         */

        for (const result of results ?? []) {
            for (const item of result?.gResult?.items ?? []) {
                if (!linkMap.has(item.link)) {
                    const parsableItem: ParsableItem = Object.assign({}, result.query, {
                        url: item.link,
                        keywords: Array.from(new Set(result.query.keywords)), // keywords without duplicates
                        counter: 1
                    });
                    linkMap.set(item.link, parsableItem);
                } else {
                    const matching = linkMap.get(item.link);

                    linkMap.set(item.link, Object.assign({}, matching, {
                        keywords: Array.from(new Set( // merge keywords without duplicates
                            matching.keywords.concat(result.query.keywords)
                        )),
                        score: matching.score + result.query.score, // accumulate score
                        counter: (matching as any).counter + 1 // store counter to compute average
                    }));
                }

            }
        }

        for (const parsableItem of linkMap.values()) {
            parsableItem.score = parsableItem.score / (parsableItem as any).counter;
            delete (parsableItem as any).counter;
            finalResult.push(parsableItem);
        }

        return finalResult;
    }

    /**
     * Given a list of urls, they get fetched, parsed and mapped to a PageResult.
     *
     * @param list The list of the urls without duplicates to fetch and parse.
     * @returns The array of page results corresponding to the parsed pages returned from Google.
     */
    private async parseList(list: Array<ParsableItem>): Promise<Array<PageResult>> {
        const results: Array<PageResult> = [];

        return Promise.all(
            list
                .map((item, index) => {
                    // Scrape text from results
                    return this.parser.parse(item.url)
                        .then(pageResult => {

                            if (!pageResult)
                                return;

                            pageResult = Object.assign({}, pageResult, item, {
                                score: item.score * (1 - (index / list.length))
                            });

                            results.push(pageResult);
                            logger.silly("[search.ts] Parsed link.", { url: item.url });
                        })
                        .catch(ex => {
                            logger.warn("[search.ts] Parser error: ", ex, ". Link: " + item.url);
                        });
                })
        ).then(() => results);
    }
}
