export interface QueryExpansionRequest {
    userId: number;
    userTastes: Array<string>;
    language: string;
}

export interface KeywordExpansion {
    [keyword: string]: Array<string>;
}

export interface QueryExpansionResponse {
    userId: number;
    userTastes: Array<string>;
    keywordExpansion: KeywordExpansion;
    language: string;
}

export interface Query {
    searchTerms: string;
    score: number;
    keywords: Array<string>;
}
