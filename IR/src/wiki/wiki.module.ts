import wiki from 'wikijs';

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


    /**
     * Given a query and a language, it gets the first result on the list and retrieves the searched field in the Wikipedia page
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @param field The specific field to retrieve in the page
     */
    public async getField(query: string, language: string, field: string) {
        return this.fields[field].call(this, query, language);
    }


}