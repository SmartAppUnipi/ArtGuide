import { ClassificationResult } from "./classification.models";
import { GoogleSearchResult } from "./google-search.models";
import { UserProfile } from "./user-profile.model";
import { KnownInstance, WikiDataProperties } from "./wikidata-result.model";
import { PageResult, PageSection } from "./page-result.model";
import { TailoredTextResponse, TailoredTextRequest } from "./tailored-text.model";
import { Query, QueryExpansionRequest, QueryExpansionResponse } from "./query-expansion.models";

export {
    ClassificationResult,
    UserProfile,

    Query,
    QueryExpansionResponse,
    QueryExpansionRequest,

    KnownInstance,
    WikiDataProperties,

    GoogleSearchResult,

    PageSection,
    PageResult,

    TailoredTextRequest,
    TailoredTextResponse
};
