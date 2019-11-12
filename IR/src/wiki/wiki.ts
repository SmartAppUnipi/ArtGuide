import wiki from 'wikijs'
import {Result, Page } from "wikijs"
import { ClassificationResult, PageResult} from "../models"
import { PageSection } from 'src/models/page-result.model';

export class ComposedSection {
    title: string;
    content: string;
    items : Array<PageSection>;
}

/**
 * Performs Wikipedia Search through the APIs.
 */
export class Wiki {

    private fields:{ [key: string]: any} = {
        "content": this.getContent,
        "summary": this.getSummary,
        "references": this.getReferences,
        "links": this.getLinks,
        "images": this.getImages,
    };

    /**
     * Get a list of results, given a query and a language
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<Result>} the list of Wikipedia pages associated to the given query.
     */
    private resultsList(query: string, language: string) : Promise<Result> {
        return wiki({ apiUrl: 'https://' + language + '.wikipedia.org/w/api.php' }).search(query);
    }

    /**
     * Given a query and a language, it gets the first result on the list and retrieves the corresponding Wikipedia page
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<Page>} the Wikipedia page
     */
    private getPage(query: string, language: string) : Promise<Page> {
        return this.resultsList(query, language).then(data => wiki({ apiUrl: 'https://' + language + '.wikipedia.org/w/api.php' }).page(data.results[0]));
    }

    /**
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<string>} All the sections and subsections of the Wikipedia page, with their title and content.
    */
    private getContent(query: string, language: string) : Promise<string> {
        return this.getPage(query, language).then(page => page.content());
    }

     /**
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<string>} The summary at the top of the Wikipedia page.
    */
    private getSummary(query: string, language: string) : Promise<string> {
        return this.getPage(query, language).then(page => page.summary());
    }

    private getReferences(query: string, language: string) : Promise<string[]> {
        return this.getPage(query, language).then(page => page.references());
    }

    private getLinks(query: string, language: string) : Promise<string[]> {
        return this.getPage(query, language).then(page => page.links());
    }

    private getImages(query: string, language: string) : Promise<string[]> {
        return this.getPage(query, language).then(page => page.images());
    }

    private getPageURL(query: string, language: string) : Promise<URL>{
        return this.getPage(query, language).then(page => page.url());
    }


    /**
     * Given a query and a language, it gets the first result on the list and retrieves the searched field in the Wikipedia page
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @param field The specific field to retrieve in the page
     * @returns {Promise<any>} an object containing the requested field from the Wikipeda page. 
     */
    public async getField(query: string, language: string, field: string) {
        return this.fields[field].call(this, query, language);
    }

    //TODO: documentation and proper testing
    /**
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns {Promise<PageResult>} 
    */
    public async getWikiInfo(query: string, language: string) : Promise<PageResult> {
        const title = await this.resultsList(query, language).then(data => data.results[0])
        const url = await this.getPageURL(query, language)
        const content: Array<ComposedSection> = await this.getField(query, language, "content")
        let sections : Array<PageSection> = []
        let keywords : Array<string> = []

        content.forEach(element => {
            if(element.hasOwnProperty('items')){
                // Section with subsections
                element["items"].forEach(item => {
                    sections.push(item)
                    keywords.push(element["title"]);
                });
            } else {
                // Section without subsections
                sections.push(element)
            }
        });

        return {
            "url": url.toString(),
            "title" : title,
            "sections": sections,
            "keywords": keywords
        }
    }

    /**
     * Builds a query basing on the Classification module result.
     * @param classificationResult The object received from the Classification module.
     * @returns {Array<string>} A query string.
     */
    private buildQueries(classificationResult: ClassificationResult) : Array<string> {
        // FIXME: return a meaningful query
        return [classificationResult.classification.entities[0].description]
    }

    /**
     * Perform a Wikipedia search.
     * @param classificationResult The object received from the Classification module.
     * @returns {Promise<Array<PageResult>>} A list of page results.
     */
    public search(classificationResult: ClassificationResult) : Promise<Array<PageResult>> {
        const queries = this.buildQueries(classificationResult)
        // TODO: handle inexistent wiki page in that language
        const lang = classificationResult.userProfile.language.toLocaleLowerCase()
        return Promise.all(queries.map(async q => this.getWikiInfo(q, lang)))
    }

}