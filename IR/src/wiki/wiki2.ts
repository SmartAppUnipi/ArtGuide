import logger from "../logger";
import { Page } from "wikijs";
import wiki from "wikijs";
import { WikiData } from "../wikidata"
import { ClassificationResult, PageResult, PageSection, Query } from "../models";

interface ComposedSection {
    title: string;
    content: string;
    items: Array<PageSection>;
}

/** WikiData module */
const wikidata = new WikiData();

/**
 * Performs Wikipedia Search through the APIs.
 */
export class Wiki {

    /**
     * Perform a Wikipedia search.
     *
     * @param classificationResult The object received from the Classification module.
     * @returns A list of page results.
     * @throws When WikiPedia APIs return an error.
     */
    public async search(classificationResult: ClassificationResult): Promise<Array<PageResult>> {
        const queries = await this.buildQueries(classificationResult);
        // FIXME: handle inexistent wiki page in that language
        const lang = classificationResult.userProfile.language.toLocaleLowerCase();
        return Promise.all(queries.map(q => this.getWikiInfo(q.searchTerms, lang)))
            .catch(err => {
                logger.error("[wiki.ts] Error in search: ", err);
                throw err;
            });
    }

    /**
     * Builds a query basing on the Classification module result.
     *
     * @param classificationResult The object received from the Classification module.
     * @returns A list of query. If there aren't classification entities an empty array is returned.
     */
    private async buildQueries(classificationResult: ClassificationResult): Promise<Array<Query>> {

        if (!classificationResult.classification.entities ||
            !classificationResult.classification.entities.length) {
            logger.debug("[wiki.ts] Classification entities are empty");
            return [];
        }

        const entity = classificationResult.classification.entities[0];
        const id = entity.entityId;
        const lang = classificationResult.userProfile.language;
        const mainQuery: Query = {
            searchTerms: await wikidata.getWikipediaName(lang, id),
            score: entity.score,
            keywords: [],
            language: classificationResult.userProfile.language
        };
        // TODO: build other queries using the WikiData tags.
        const queries = [mainQuery];
        logger.silly("[wiki.ts] Basic query built: " + queries);
        return queries;
    }

    /**
     * Retrieve WikiPedia info for a query string in a specified language.
     *
     * @param query The string to be searched.
     * @param language The language code, ie. the Wikipedia subdomain to search in.
     * @returns The WikiPedia content as PageResult object.
     * @throws When WikiPedia APIs returns error.
     */
    private getWikiInfo(query: string, language: string): Promise<PageResult> {
        // wiki object initialized with WikiPedia API endpoint
        const wikipedia = wiki({ apiUrl: "https://" + language + ".wikipedia.org/w/api.php" });
        return wikipedia.search(query)
            .then(resultsList => {
                const title = resultsList.results[0];
                // return wikipedia.findById("Q17")
                return wikipedia.page(title)
                    .then(page => this.buildResult(page))
                    .then(pageResult => {
                        pageResult.title = title;
                        return pageResult;
                    })
                    .catch(ex => {
                        logger.error("[wiki.ts] Error in getting the page " + title + " from Wikipedia", ex);
                        throw ex;
                    });
            })
            .catch(ex => {
                logger.error("[wiki.ts] Error while retrieving information about " + query + " from Wikipedia", ex);
                throw ex;
            });
    }

    /**
     * Given a WikiPedia Page builds a PageResult.
     *
     * @param page A WikiPedia page.
     * @returns A PageResult object without the title field set.
     * @throws When WikiPedia APIs returns error.
     */
    private buildResult(page: Page): Promise<PageResult> {
        // PageResult object to be returned
        const pageResult: PageResult = {
            url: "",
            title: "",      // set by the caller
            sections: [],
            summary: "",
            keywords: [],   // keywords are populated from caller which knows the query object
            tags: []        // tags are populated from caller which knows the query object
        };
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
                .catch(ex => {
                    logger.error("[wiki.ts] Error in getting the sections from the page " +
                        pageResult.title + " of Wikipedia", ex);
                    throw ex;
                }),
            // set summary
            page.summary()
                .then(summary => {
                    pageResult.summary = summary;
                })
                .catch(ex => {
                    logger.error("[wiki.ts] Error in getting the summary from the page " +
                        pageResult.title + " of Wikipedia", ex);
                    throw ex;
                })
        ]).then(() => pageResult);
    }

}