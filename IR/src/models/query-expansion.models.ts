export interface QueryExpansionRequest {
    userId: number;
    userTastes: Array<string>;
    language: string;
}

export interface KeywordExpansion {
    [keyword: string]: Array<string>;
}

export interface QueryExpansionResponse {
    keywordExpansion: KeywordExpansion;
}

export interface Query {
    searchTerms: string;
    score: number;
    keywords: Array<string>;
}
