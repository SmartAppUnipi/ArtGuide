import logger from "../logger";
import { Page } from "wikijs";
import wiki from "wikijs";
import { knownInstanceProperties, scoreWeight } from "../../config.json";
import { MetaEntity, PageResult, PageSection, Query } from "../models";

interface ComposedSection {
    title: string;
    content: string;
    items: Array<PageSection>;
}

/**
 * Performs Wikipedia Search through the APIs.
 */
export class Wikipedia {

    /**
     * Perform a Wikipedia search give a classification result (not a known instance).
     *
     * @param metaEntities The entities with WikiData properties.
     * @param language The language code, ie. the Wikipedia subdomain to search in.
     * @returns A list of page results.
     * @throws When WikiPedia APIs return an error.
     */
    public search(metaEntities: Array<MetaEntity>, language: string): Promise<Array<PageResult>> {
        return Promise.all(this.buildQueries(metaEntities, language)
            ?.map(query => this.getWikiInfo(query.searchTerms, language, query.score)))
            .then(results => results.filter(result => result))
            .catch(/* istanbul ignore next */ ex => {
                logger.error("[wikipedia.ts] Error in search.", { metaEntities, exception: ex });
                return Promise.resolve([]);
            });
    }

    /**
     * Search for a page assuming that is a known instance.
     *
     * @param knownInstance The non-null KnownInstance object.
     * @param language The language code, ie. the Wikipedia subdomain to search in.
     * @returns An array of PageResult about the piece of art and correlated pages like the author.
     */
    public searchKnownInstance(knownInstance: MetaEntity, language: string): Promise<Array<PageResult>> {
        if (!knownInstance) return Promise.resolve([]);
        const promises = [];
        // search for the entity
        promises.push(this.getWikiInfo(knownInstance.wikipediaPageTitle, language, knownInstance.score));
        // search for the properties
        const propertyScore = knownInstance.score * scoreWeight.known.wikidataProperty;
        for (const property of knownInstanceProperties) {
            for (const value of knownInstance[property] || [])
                promises.push(this.getWikiInfo(value, language, propertyScore));

        }
        return Promise.all(promises)
            .then(results => results.filter(result => result))
            .catch(/* istanbul ignore next */ ex => {
                logger.error("[wikipedia.ts] Error in searchKnownInstance.", { knownInstance, exception: ex });
                return Promise.resolve([]);
            });
    }

    /**
     * Builds a query basing on the Classification result (not a known instance).
     *
     * @param metaEntities The entities with WikiData properties.
     * @param language The language code, ie. the Wikipedia subdomain to search in.
     * @returns A list of query. If there aren't classification entities an empty array is returned.
     */
    private buildQueries(metaEntities: Array<MetaEntity>, language: string): Array<Query> {
        // use all the entities
        const queries = metaEntities?.map(entity => {
            return {
                searchTerms: entity?.wikipediaPageTitle,
                score: entity?.score,
                language
            } as Query;
        });
        logger.silly("[wikipedia.ts] Queries built: " + queries);
        return queries;
    }


    /**
     * Retrieve WikiPedia info for a query string in a specified language.
     *
     * @param query The string to be searched.
     * @param language The language code, ie. the Wikipedia subdomain to search in.
     * @param score The score of the query.
     * @returns The WikiPedia content as PageResult object.
     * @throws When WikiPedia APIs returns error.
     */
    private getWikiInfo(query: string, language: string, score: number): Promise<PageResult> {
        // wiki object initialized with WikiPedia API endpoint
        const wikijs = wiki({ apiUrl: "https://" + language + ".wikipedia.org/w/api.php" });
        return wikijs.search(query)
            .then(resultsList => {
                const title = resultsList.results[0];
                return wikijs.page(title)
                    .then(page => this.buildResult(page, score))
                    .then(pageResult => {
                        pageResult.title = title;
                        logger.debug("[wikipedia.ts] PageResult correctly build for the query.", { query: query });
                        return pageResult;
                    })
                    .catch(/* istanbul ignore next */ ex => {
                        logger.error("[wikipedia.ts] Error in getting the page from Wikipedia.",
                                     { title: title, exception: ex });
                        return Promise.resolve(null);
                    });
            })
            .catch(/* istanbul ignore next */ ex => {
                logger.error("[wikipedia.ts] Error while retrieving result from Wikipedia.",
                             { query: query, exception: ex });
                return Promise.resolve(null);
            });
    }

    /**
     * Given a WikiPedia Page builds a PageResult.
     *
     * @param page A WikiPedia page.
     * @param score The score of the query.
     * @returns A PageResult object without the title field set.
     * @throws When WikiPedia APIs returns error.
     */
    private buildResult(page: Page, score: number): Promise<PageResult> {
        // PageResult object to be returned
        const pageResult = { score: score, sections: [], keywords: [] } as PageResult;
        // set url
        pageResult.url = page.url().toString();
        // set sections
        return Promise.all([
            page.content()
                .then(content => JSON.parse(JSON.stringify(content)) as Array<ComposedSection>)
                .then(content => {
                    // set sections
                    content.forEach(element => {
                        // section with subsections
                        if (element.items) {
                            element.items.forEach(item => {
                                item.tags = [element.title];
                                item.score = score;
                                pageResult.sections.push(item);
                            });
                        } else
                            // section without subsections
                            pageResult.sections.push(Object.assign({}, element, { tags: [element.title], score }));
                    });
                })
                .catch(/* istanbul ignore next */ ex => {
                    logger.error("[wikipedia.ts] Error in getting the sections from the page.",
                                 { page: pageResult.title, exception: ex });
                }),
            // set summary
            page.summary()
                .then(summary => {
                    pageResult.summary = summary;
                })
                .catch(/* istanbul ignore next */ ex => {
                    logger.error("[wikipedia.ts] Error in getting the summary from the page.",
                                 { page: pageResult.title, exception: ex });
                })
        ]).then(() => {
            logger.debug("[wikipedia.ts] PageResult correctly built.",
                         { pageTitle: pageResult.title, pageUrl: pageResult.url });
            return pageResult;
        });
    }

}