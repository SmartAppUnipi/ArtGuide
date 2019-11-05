import wiki from 'wikijs';

export class WikiSearch{

    /**
     * Get a list of results, given a query and a language
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     */
    public async resultsList(query: string, language: string){
        return wiki({ apiUrl: 'https://'+language+'.wikipedia.org/w/api.php' }).search(query);
    }

    /**
     * Given a query and a language, it gets the first result on the list and retrieves the corresponding Wikipedia page
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     */
    private async getPage(query: string, language: string){
        return this.resultsList(query, language).then( data => wiki({ apiUrl: 'https://'+language+'.wikipedia.org/w/api.php' }).page(data.results[0]));
    }

    /**
     * Given a query and a language, it gets the first result on the list and retrieves the searched field in the Wikipedia page
     * @param query The searched item
     * @param language The Wikipedia subdomain to search in
     * @param field The specific field to retrieve in the page
     */
    public async getField(query: string, language: string, field: string){
        const page = await this.getPage(query, language);

        switch (field) {
            case "content":
                return page.content();
            
            case "summary":
                return page.summary();

            case "references":
                return page.references();
            
            case "links":
                return page.links();
            
            case "images":
                return page.images();
        
            default:
                break;
        }
    }


}