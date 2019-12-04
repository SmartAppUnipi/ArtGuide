import logger from "../logger";
import { Page } from "wikijs";
import wiki from "wikijs";
import { WikiData } from ".";
import { ClassificationResult, KnownInstance, PageResult, PageSection, Query } from "../models";

interface ComposedSection {
    title: string;
    content: string;
    items: Array<PageSection>;
}

/**
 * Performs Wikipedia Search through the APIs.
 */
export class Wikipedia {

    /** The Wikidata module */
    private wikidata = new WikiData();

    /**
     * Perform a Wikipedia search give a classification result (not a known instance).
     *
     * @param classificationResult The object received from the Classification module.
     * @returns A list of page results.
     * @throws When WikiPedia APIs return an error.
     */
    public search(classificationResult: ClassificationResult): Promise<Array<PageResult>> {
        return this.buildQueries(classificationResult)
            .then(queries => {
                const lang = classificationResult.userProfile.language.toLocaleLowerCase();
                return Promise.all(queries.map(query => this.getWikiInfo(query.searchTerms, lang, query.score)));
            })
            .catch(/* istanbul ignore next */ ex => {
                logger.error("[wikipedia.ts] Error in search.",
                    { entities: classificationResult.classification.entities, exception: ex });
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
    public searchKnownInstance(knownInstance: KnownInstance, language: string): Promise<Array<PageResult>> {
        return Promise.all([
            // TODO: look also for: creator/architect, period, style, movement 
            this.getWikiInfo(knownInstance.WikipediaPageTitle, language, knownInstance.score)
        ]);
    }

    /**
     * Builds a query basing on the Classification result (not a known instance).
     *
     * @param classificationResult The object received from the Classification module.
     * @returns A list of query. If there aren't classification entities an empty array is returned.
     */
    private buildQueries(classificationResult: ClassificationResult): Promise<Array<Query>> {
        const language = classificationResult.userProfile.language;
        // use all the entities
        return Promise.all(
            classificationResult.classification.entities.map(entity => {
                // get the Wikipedia page name from WikiData
                return this.wikidata.getWikipediaName(entity.entityId, language)
                    // build the query
                    .then(wikipediaName => {
                        return new Query({
                            searchTerms: wikipediaName,
                            score: entity.score,
                            language: language
                        });
                    })
                    .catch(/* istanbul ignore next */ ex => {
                        logger.error("[wikipedia.ts] Error while getting Wikipedia page name.",
                            { entityId: entity.entityId, exception: ex });
                        return null;
                    });
            })
        ).then(queries =>
            queries.filter(query => query != null)
        )
            .then(queries => {
                logger.silly("[wikipedia.ts] Queries built: " + queries);
                return queries;
            })
            .catch/* istanbul ignore next */(ex => {
                logger.error("[wikipedia.ts] Error while building queries.",
                    { entities: classificationResult.classification.entities, exception: ex });
                return Promise.resolve([]);
            });
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
        const pageResult = new PageResult({ score: score });
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
                                pageResult.sections.push(item);
                            });
                        } else
                            // section without subsections
                            pageResult.sections.push(Object.assign({}, element, { tags: [element.title] }));
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