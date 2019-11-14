import logger from "../logger";
import wiki from "wikijs";
import { ClassificationResult, PageResult, PageSection, Query } from "../models";
import { Page, Result } from "wikijs";

interface ComposedSection {
    title: string;
    content: string;
    items: Array<PageSection>;
}

/**
 * Performs Wikipedia Search through the APIs.
 */
export class Wiki {

    /**
     * Perform a Wikipedia search.
     *
     * @param classificationResult The object received from the Classification module.
     * @returns A list of page results.
     * @throws {Error} FIXME: write this field
     */
    public search(classificationResult: ClassificationResult): Promise<Array<PageResult>> {
        const queries = this.buildQueries(classificationResult);
        // FIXME: handle inexistent wiki page in that language
        const lang = classificationResult.userProfile.language.toLocaleLowerCase();
        return Promise.all(queries.map(q => this.getWikiInfo(q.searchTerms, lang)))
            .catch(err => {
                logger.error("[wiki.ts] Error in search: ", err);
                throw err;
            });
    }

    /**
     * FIXME: write this line
     *
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns 
     * @throws {Error} FIXME: write this field
     */
    public async getWikiInfo(query: string, language: string): Promise<PageResult> {
        try {
            const title = await this.resultsList(query, language).then(data => data.results[0]);
            const url = await this.getPageURL(query, language);
            const content: Array<ComposedSection> = await this.getField(query, language, "content");

            const sections: Array<PageSection> = [];

            content.forEach(element => {
                if (Object.prototype.hasOwnProperty.call(element, "items") && element.items) {
                    // Section with subsections
                    element.items.forEach(item => {
                        item.tags = [element.title];
                        sections.push(item);
                    });
                } else {
                    // Section without subsections
                    sections.push(Object.assign({}, element, { tags: [element.title] }));
                }
            });

            return {
                url: url.toString(),
                title: title,
                sections: sections,
                keywords: [], // keywords are populated from caller which knows the query object
                tags: [] // tags are populated from caller which knows the query object
            };
        } catch (err) {
            logger.error("[wiki.ts] Error while getting info from Wikipedia", err);
            throw err;
        }
    }

    /**
     * Get a list of results, given a query and a language
     *
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<Result>} the list of Wikipedia pages associated to the given query.
     * @throws {Error} FIXME: write this field
     */
    private resultsList(query: string, language: string): Promise<Result> {
        return wiki({ apiUrl: "https://" + language + ".wikipedia.org/w/api.php" }).search(query)
            .catch(err => {
                logger.error("[wiki.ts] Error while searching for " + query, err);
                throw err;
            });
    }

    /**
     * Given a query and a language, it gets the first result on the list and retrieves the corresponding Wikipedia page
     *
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<Page>} the Wikipedia page
     * @throws {Error} FIXME: write this field
     */
    private getPage(query: string, language: string): Promise<Page> {
        return this.resultsList(query, language)
            .then(data => wiki({ apiUrl: "https://" + language + ".wikipedia.org/w/api.php" })
                .page(data.results[0]))
            .catch(err => {
                logger.error("[wiki.ts] Error while retrieving Wikipedia page " + query, err);
                throw err;
            });
    }

    /**
     * FIXME: write this line
     *
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<string>} All the sections and subsections of the Wikipedia page, with their title and content.
     */
    private getContent(query: string, language: string): Promise<string> {
        return this.getPage(query, language)
            .then(page => page.content());
    }

    /**
     * FIXME: write this line
     *
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<string>} The summary at the top of the Wikipedia page.
     */
    private getSummary(query: string, language: string): Promise<string> {
        return this.getPage(query, language).then(page => page.summary());
    }

    /**
     * FIXME: write this doc
     *
     * @param query 
     * @param language 
     */
    private getReferences(query: string, language: string): Promise<Array<string>> {
        return this.getPage(query, language).then(page => page.references());
    }

    /**
     * FIXME: write this doc
     *
     * @param query 
     * @param language 
     */
    private getLinks(query: string, language: string): Promise<Array<string>> {
        return this.getPage(query, language).then(page => page.links());
    }

    /**
     * FIXME: write this doc
     *
     * @param query 
     * @param language 
     */
    private getImages(query: string, language: string): Promise<Array<string>> {
        return this.getPage(query, language).then(page => page.images());
    }

    /**
     * Given a query and a language, it gets the first result on the list
     * and retrieves the searched field in the Wikipedia page
     *
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @param field The specific field to retrieve in the page
     * @returns {Promise<any>} an object containing the requested field from the WikiPedia page. 
     */
    private getField(query: string, language: string, field: string): Promise<any> {
        const functionName = `get${field.substr(0, 1).toUpperCase()}${field.substr(1)}`;
        const functionToCall: (query: string, language: string) => Promise<any> = (this as any)[functionName];
        return functionToCall.call(this, query, language);
    }

    /**
     * FIXME: write this doc
     *
     * @param query
     * @param language
     */
    private getPageURL(query: string, language: string): Promise<URL> {
        return this
            .getPage(query, language)
            .then(page => page.url());
    }

    /**
     * Builds a query basing on the Classification module result.
     *
     * @param classificationResult The object received from the Classification module.
     * @returns {Array<Query>} A list of query.
     * If classification entities is empty an empty array is returned.
     */
    private buildQueries(classificationResult: ClassificationResult): Array<Query> {

        if (!classificationResult.classification.entities ||
            !classificationResult.classification.entities.length) {
            logger.debug("[wiki.ts] Classification entities are empty");
            return [];
        }

        const entity = classificationResult.classification.entities[0];
        const mainQuery: Query = {
            searchTerms: entity.description,
            score: entity.score,
            keywords: []
        };
        // TODO: build other queries using the WikiData tags.
        const queries = [mainQuery];
        logger.silly("[search.ts] Basic query built: ", queries);
        return queries;
    }
}