import { ClassificationResult } from "./classification.models";
import { GoogleSearchResult } from "./google-search.models";
import { KnownInstance } from "./known-instance.models";
import { UserProfile } from "./user-profile.model";
import { PageResult, PageSection } from "./page-result.model";
import { Query, QueryExpansionRequest, QueryExpansionResponse } from "./query-expansion.models";
import { WikiDataFields, WikiDataResult } from "./wikidata-result.model";

export {
    ClassificationResult,
    UserProfile,

    Query,
    QueryExpansionResponse,
    QueryExpansionRequest,

    KnownInstance,

    GoogleSearchResult,
    
    WikiDataResult,
    WikiDataFields,

    PageSection,
    PageResult
};
