import logger from "../logger";
import wiki from "wikijs";
import { ClassificationResult, PageResult, PageSection, Query } from "../models";
import { Page, Result } from "wikijs";

interface ComposedSection {
    title: string;
    content: string;
    items: PageSection[];
}

/**
 * Performs Wikipedia Search through the APIs.
 */
export class Wiki {

    private fields: { [key: string]: any } = {
        content: this.getContent.bind(this),
        summary: this.getSummary.bind(this),
        references: this.getReferences.bind(this),
        links: this.getLinks.bind(this),
        images: this.getImages.bind(this)
    };

    /**
     * Given a query and a language, it gets the first result
     * on the list and retrieves the searched field in the Wikipedia page
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @param field The specific field to retrieve in the page
     * @returns {Promise<any>} an object containing the requested field from the Wikipeda page.
     */
    public getField(query: string, language: string, field: string): any {
        return this.fields[field](query, language);
    }

    /**
     * TODO: write this line
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<PageResult>}
     */
    public async getWikiInfo(query: string, language: string): Promise<PageResult> {
        try {
            const title = await this.resultsList(query, language).then(data => data.results[0]);
            const url = await this.getPageURL(query, language);
            const content: ComposedSection[] = await this.getField(query, language, "content");

            const sections: PageSection[] = [];

            content.forEach(element => {
                if (Object.prototype.hasOwnProperty.call(element, "items") && element.items) {
                    // Section with subsections
                    element.items.forEach(item => {
                        item.tags = [element.title];
                        sections.push(item);
                    });
                } else
                    // Section without subsections
                    sections.push(Object.assign({}, element, { tags: [element.title] }));

            });

            return {
                url: url.toString(),
                title,
                sections,
                keywords: [], // keywords are populated from caller which knows the query object
                tags: [] // tags are populated from caller which knows the query object
            };
        } catch (err) {
            logger.error("Error while getting info from Wikipedia", err);
            throw err;
        }

    }

    /**
     * Perform a Wikipedia search.
     * @param classificationResult The object received from the Classification module.
     * @returns {Promise<Array<PageResult>>} A list of page results.
     */
    public search(classificationResult: ClassificationResult): Promise<PageResult[]> {
        const queries = this.buildQueries(classificationResult);
        // TODO: handle inexistent wiki page in that language
        const lang = classificationResult.userProfile.language.toLocaleLowerCase();
        return Promise.all(queries.map(q => this.getWikiInfo(q.searchTerms, lang)))
            .catch(err => {
                logger.error("Error in function search.", err);
                throw err;
            });
    }

    /**
     * Get a list of results, given a query and a language
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<Result>} the list of Wikipedia pages associated to the given query.
     */
    private resultsList(query: string, language: string): Promise<Result> {
        return wiki({ apiUrl: "https://" + language + ".wikipedia.org/w/api.php" }).search(query)
            .catch(err => {
                logger.error("Error while searching for " + query, err);
                throw err;
            });
    }

    /**
     * Given a query and a language, it gets the first result on the list and retrieves the corresponding Wikipedia page
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<Page>} the Wikipedia page
     */
    private getPage(query: string, language: string): Promise<Page> {
        return this.resultsList(query, language)
            .then(data => wiki({ apiUrl: "https://" + language + ".wikipedia.org/w/api.php" })
                .page(data.results[0]))
            .catch(err => {
                logger.error("Error while retrieving Wikipedia page " + query, err);
                throw err;
            });
    }

    /**
     * TODO: write this line
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<string>} All the sections and subsections of the Wikipedia page, with their title and content.
     */
    private getContent(query: string, language: string): Promise<string> {
        return this.getPage(query, language)
            .then(page => page.content());
    }

    /**
     * TODO: write this line
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<string>} The summary at the top of the Wikipedia page.
     */
    private getSummary(query: string, language: string): Promise<string> {
        return this.getPage(query, language).then(page => page.summary());
    }

    /**
     * TODO: write this doc
     * @param query
     * @param language
     */
    private getReferences(query: string, language: string): Promise<string[]> {
        return this.getPage(query, language).then(page => page.references());
    }

    /**
     * TODO: write this doc
     * @param query
     * @param language
     */
    private getLinks(query: string, language: string): Promise<string[]> {
        return this.getPage(query, language).then(page => page.links());
    }

    /**
     * TODO: write this doc
     * @param query
     * @param language
     */
    private getImages(query: string, language: string): Promise<string[]> {
        return this.getPage(query, language).then(page => page.images());
    }

    /**
     * TODO: write this doc
     * @param query
     * @param language
     */
    private getPageURL(query: string, language: string): Promise<URL> {
        return this.getPage(query, language).then(page => page.url());
    }

    /**
     * Builds a query basing on the Classification module result.
     * @param classificationResult The object received from the Classification module.
     * @returns {Array<Query>} A list of query.
     * If classification entities is empty an empty array is returned.
     */
    private buildQueries(classificationResult: ClassificationResult): Query[] {

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
