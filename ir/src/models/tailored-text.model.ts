import { MetaEntity, PageResult, UserProfile } from './'


export interface TailoredTextRequest {
    userProfile: UserProfile;
    results: Array<PageResult>;
}

export interface TailoredTextResponse {
    userProfile: UserProfile;
    results: Array<PageResult>;
    tailoredText: string;
    requestId: string;
    knownInstance: MetaEntity;
    validation: Array<Metadata>;
}

export interface Metadata {
    sentenceId: string;
    text: string;
    matchingPageResult: PageResult;
}