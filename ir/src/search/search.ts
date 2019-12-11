import { Adaptation } from "../adaptation";
import { GoogleSearch } from "./google-search";
import logger from "../logger";
import { Parser } from "../parser";
import { flowConfig, knownInstanceProperties, scoreWeight, searchBlackList } from "../../config.json";
import {
    GoogleSearchResult,
    MetaEntity,
    PageResult,
    Query,
    QueryExpansionResponse,
    UserProfile
} from "../models";



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
        // TODO: return a meaningful query
        const queries = metaEntities
            .map(metaEntity => {
                return {
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
            queries.map(async q => {
                // query Google Search and get the list of results
                return this.googleSearch
                    .query(q.searchTerms + " " + q.keywords.join(" "), userProfile)
                    .then(googleSearchResult => {

                        if (!googleSearchResult || !googleSearchResult.items) {
                            logger.warn("[search.ts] Google returned no items for query.", { query: q });
                            return;
                        }

                        return {
                            gResult: googleSearchResult,
                            query: q
                        };
                    })
                    .catch(ex => {
                        logger.error("[search.ts] Caught exception while processing a query.",
                            { query: q, exception: ex });
                        return {
                            gResult: null as GoogleSearchResult,
                            query: null as Query
                        };
                    });
            })
        ).then(gResults => {

            return this
                .mergeDuplicateUrls(gResults)
                .filter(result => {
                    return !searchBlackList.some(blackListWebsite => result.url.includes(blackListWebsite))
                });

        }).then(r => {

            return this.parseList(r);

        });
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
        const queries = [];
        // search for the entity
        queries.push({
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
            .then(queries => {
                return Promise.all(
                    queries.map(query => {
                        return this.googleSearch
                            .query(query.searchTerms, userProfile)
                            .then(r => ({
                                gResult: r,
                                query: query
                            }))
                    })
                ).then(gResults => {
                    return this
                        .mergeDuplicateUrls(gResults)
                        .filter(result => {
                            return !searchBlackList.some(blackListWebsite => result.url.includes(blackListWebsite))
                        });
                }).then(r => {
                    return this.parseList(r);
                })
            });
    }

    /**
     * Merges the google duplicates urls into a single object with he merged keywords.
     * 
     * @param results The array of results from Google with the 
     * associated query that contains the search terms and the
     *  keywords that generated that results.
     */

    public mergeDuplicateUrls(results: Array<{ gResult: GoogleSearchResult, query: Query }>): Array<{ url: string, keywords: Array<string> }> 
    {

        const linkMap=new Map();
        let finalResult:Array<{ url: string, keywords: Array<string> }>=[] 
        let temp

        // create a Map and if link is not there, append it to a map toogether with its keywords
        // if link is already in the map, then take from the Map old values of keywords,
        // concatenate them with the new values and append everything to a Map 
        // In this way we merge keywords of the same queries, but still we have duplicates inside
        // To get rid of duplicates, append links toogether with keywords in the final array,
        // where we do canceling of duplicate values
        for(var i=0;i<results.length;i++)   
        {   
            for(var j=0;j<results[i].gResult.items.length;j++)    
            {    
                if(!linkMap.has(results[i].gResult.items[j].link))      
                {     
                
                    linkMap.set(results[i].gResult.items[j].link,results[i].query.keywords)     
                }    
                else       
                {
                    for(let [key,value] of linkMap)   
                    {
                        if(results[i].gResult.items[j].link==key)
                        {
                            temp=value.concat(results[i].query.keywords)  
                            linkMap.set(key,temp)                       
                        }                                  
                    } 
                    
                }              
                
            }         
        }   
        
        for(let[key,value]of linkMap)
        {
            finalResult.push({url:key,keywords:value})
        }
        
        for(let i=0;i<finalResult.length;i++)
        {
            for(let j=0;j<finalResult[i].keywords.length;j++)
            {
                for(let z=j+1;z<finalResult[i].keywords.length;z++)
                {
                    if(finalResult[i].keywords[j]==finalResult[i].keywords[z])
                    {
                        finalResult[i].keywords.splice(z,1)
                    }
                }
            }
        }
        
        return finalResult
    }

    /**
     * Given a GoogleSearchResult, for each returned item the parser gets invoked and
     *the text content of the corresponding page is inserted into a PageResult.
     *
     *Since the keywords that are associated to that google result cannot be inferred from the results themselves,
     *they must be explicitly passed by the caller.
     *
     * @param googleResult The google search result.
     * @param query The query that produced the result.
     * @returns The array of page results corresponding to the parsed pages returned from Google.
     */
    private async parseList(list: Array<{ url: string, keywords: Array<string>, score: number }>): Promise<Array<PageResult>> {
        const results: Array<PageResult> = [];

        return Promise.all(
            list
                .map((item, index) => {
                    // Scrape text from results
                    return this.parser.parse(item.url)
                        .then(pageResult => {

                            if (!pageResult)
                                return;

                            // TODO: assign a score multiplier read from config.json
                            pageResult.score = item.score * (1 - (index / list.length));
                            pageResult.keywords = item.keywords;

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
