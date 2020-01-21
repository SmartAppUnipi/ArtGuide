import { AdaptationEndpoint } from "./environment";
import fetch from "node-fetch";
import logger from "./logger";
import {
    PageResult,
    QueryExpansionRequest,
    QueryExpansionResponse,
    TailoredTextRequest,
    TailoredTextResponse,
    UserProfile
} from "./models";
import { generateId } from "./utils";


/**
 * An interface for the communications with the Adaptation module.
 */
export class Adaptation {

    /**
     * Perform a POST request to a specified endpoint with a custom json in the body.
     *
     * @param url Url (string) of the POST request. Must include protocol port if different from the default.
     * @param body A JS object that will be stringified and sent as a JSON.
     * @returns A promise resolved with the received JSON parsed as JS object of type T.
     */
    private post<T = any>(url: string, body: any): Promise<T> {
        return fetch(url, {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" }
        })
            .then(res => res.json());
    }

    /**
     * Call the adaptation endpoint to get the query expansion.
     *
     * @param userProfile The user profile coming from the UI needed for the query expansion.
     * @returns A promise resolved with the query expansion containing the keywords.
     */
    public getKeywordExpansion(userProfile: UserProfile): Promise<QueryExpansionResponse> {
        logger.debug("[adaptation.ts] Keyword expansion request", { url: AdaptationEndpoint.keywords, userProfile });
        return this.post<QueryExpansionResponse>(
            AdaptationEndpoint.keywords,
            { userProfile } as QueryExpansionRequest
        ).then(queryExpansionResponse => {
            logger.debug("[adaptation.ts] Keyword expansion response", { queryExpansionResponse });
            return queryExpansionResponse;
        });
    }

    /**
     * Pass the results of our module to adaptation.
     *
     * @param results The array of page results.
     * @param userProfile The user profile coming from the UI needed for the adaptation.
     * @returns A promise resolved with the tailored text when sent by the adaptation module.
     */
    public getTailoredText(results: Array<PageResult>, userProfile: UserProfile): Promise<TailoredTextResponse> {
        logger.debug("[adaptation.ts] Adaptation text request", { url: AdaptationEndpoint.text, results });
        return this.post<TailoredTextResponse>(
            AdaptationEndpoint.text,
            { userProfile, results } as TailoredTextRequest
        ).then(adaptationResponse => {
            adaptationResponse.requestId = generateId(16);
            logger.debug("[adaptation.ts] Adaptation text response", { adaptationResponse });
            return adaptationResponse;
        });
    }

}