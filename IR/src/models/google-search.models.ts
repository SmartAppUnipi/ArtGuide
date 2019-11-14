export interface Url {
    type: string;
    template: string;
}

export interface Request {
    title: string;
    totalResults: string;
    searchTerms: string;
    count: number;
    startIndex: number;
    inputEncoding: string;
    outputEncoding: string;
    safe: string;
    cx: string;
}

export interface NextPage {
    title: string;
    totalResults: string;
    searchTerms: string;
    count: number;
    startIndex: number;
    inputEncoding: string;
    outputEncoding: string;
    safe: string;
    cx: string;
}

export interface Queries {
    request: Request[];
    nextPage: NextPage[];
}

export interface Context {
    title: string;
}

export interface SearchInformation {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
}

export interface Spelling {
    correctedQuery: string;
    htmlCorrectedQuery: string;
}

export interface CseThumbnail {
    width: string;
    height: string;
    src: string;
}

export interface Metatag {
    referrer: string;
}

export interface CseImage {
    src: string;
}

export interface Pagemap {
    cse_thumbnail: CseThumbnail[];
    metatags: Metatag[];
    cse_image: CseImage[];
}

export interface Item {
    kind: string;
    title: string;
    htmlTitle: string;
    link: string;
    displayLink: string;
    snippet: string;
    htmlSnippet: string;
    cacheId: string;
    formattedUrl: string;
    htmlFormattedUrl: string;
    pagemap: Pagemap;
}

export interface GoogleSearchResult {
    kind: string;
    url: Url;
    queries: Queries;
    context: Context;
    searchInformation: SearchInformation;
    spelling: Spelling;
    items: Item[];
    error?: any;
}
