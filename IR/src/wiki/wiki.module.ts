import wiki from 'wikijs';
import { Url } from 'url';

export class WikiSearch {

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
     */
    public async resultsList(query: string, language: string) {
        return wiki({ apiUrl: 'https://' + language + '.wikipedia.org/w/api.php' }).search(query);
    }

    /**
     * Given a query and a language, it gets the first result on the list and retrieves the corresponding Wikipedia page
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @returns Promise<Page>
     */
    private async getPage(query: string, language: string) {
        return this.resultsList(query, language).then(data => wiki({ apiUrl: 'https://' + language + '.wikipedia.org/w/api.php' }).page(data.results[0]));
    }

    public async getContent(query: string, language: string) {
        return this.getPage(query, language).then(page => page.content());
    }

    public async getSummary(query: string, language: string) {
        return this.getPage(query, language).then(page => page.summary());
    }

    public async getReferences(query: string, language: string) {
        return this.getPage(query, language).then(page => page.references());
    }

    public async getLinks(query: string, language: string) {
        return this.getPage(query, language).then(page => page.links());
    }

    public async getImages(query: string, language: string) {
        return this.getPage(query, language).then(page => page.images());
    }

    public async getPageURL(query: string, language: string){
        return this.getPage(query, language).then(page => page.url());
    }


    /**
     * Given a query and a language, it gets the first result on the list and retrieves the searched field in the Wikipedia page
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @param field The specific field to retrieve in the page
     * @returns a Promise that will, eventually, return a json (string if field is 'summary') containing the requested field from the Wikipeda page. 
     */
    public async getField(query: string, language: string, field: string) {
        return this.fields[field].call(this, query, language);
    }

    //TODO: documentation and proper testing
    public async getWikiInfo(query: string, language: string){
        let result = {}
        let url : Url;
        let content : string, summary : string, title : string;
        let data = await this.resultsList(query, language);
        title = data.results[0];
        url = await this.getPageURL(query, language);
        content = await this.getField(query, language, "content");
        // replace all the occurences of "items"
        // FIXME: What if "items" occurs in the text? 
        let c = JSON.stringify(content);
        c = c.replace("items", "sections");
        result = {"url": url, "title" : query, "sections": JSON.parse(c)};
        return result;
    }


}