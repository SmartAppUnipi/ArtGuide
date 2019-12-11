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

export class Query {
    searchTerms: string;
    score: number;
    keywords: Array<string>;
    language: string;


    constructor(item?: Partial<Query>) {

        const defaults = {
            score: 0,
            keywords: []
        } as Query;

        Object.assign(this, defaults, item || {});
    }
}
