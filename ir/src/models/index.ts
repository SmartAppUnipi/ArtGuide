import { ClassificationResult } from "./classification.models";
import { GoogleSearchResult } from "./google-search.models";
import { UserProfile } from "./user-profile.model";
import { KnownInstance, WikiDataProperties } from "./wikidata-result.model";
import { PageResult, PageSection } from "./page-result.model";
import { Query, QueryExpansionRequest, QueryExpansionResponse } from "./query-expansion.models";
import { TailoredTextRequest, TailoredTextResponse } from "./tailored-text.model";

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
