import { UserProfile } from "./user-profile.model";

export interface QueryExpansionRequest {
    userProfile: UserProfile;
}

export interface KeywordExpansion {
    [keyword: string]: Array<string>;
}

export interface QueryExpansionResponse {
    keywordExpansion: KeywordExpansion;
}

export interface Query {
    entityId: string;
    searchTerms: string;
    score: number;
    keywords: Array<string>;
    language: string;
}
