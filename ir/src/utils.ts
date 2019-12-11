import { BasicFieldWithId } from "./models/classification.models";
import fetch from "node-fetch";
import logger from "./logger";

/**
 * Perform a POST request to a specified endpoint with a custom json in the body.
 *
 * @param url Url (string) of the POST request. Must include the protocol and the port if different from the default.
 * @param body A JS object that will be stringified and sent as a JSON.
 * @returns A promise resolved with the received JSON parsed as JS object of type T.
 */
export function post<T = any>(url: string, body: any): Promise<T> {
    logger.silly("[utils.ts] New post request", { url });
    return fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
    }).then(res => res.json());
}

/**
 * Reduce the number of entities by cutting on the biggest jump between scores.
 *
 * @param entities The list of entities.
 * @param maxEntityNumber A limit to the number of entities to be kept. Default is all.
 * @param minScore A minimum score to keep the entity. Default is 0, ie. no min score.
 * @returns The list of survived entities.
 */
export function reduceEntities(entities: Array<BasicFieldWithId>,
        maxEntityNumber = entities.length, minScore = 0): Array<BasicFieldWithId> {
    let maxGap = -1;
    let cutIndex = -1;

    for (let i = 0; i < entities.length - 1; i++) {
        // stop if the score is too low
        if (entities[i].score < minScore)
            break;
        // find the biggest gap
        const gap = entities[i].score - entities[i + 1].score;
        if (gap > maxGap) {
            maxGap = gap;
            cutIndex = i + 1;   // cut after this item
        }
    }

    return entities
        // cut according to the calculated jump
        .slice(0, cutIndex)
        // slice ensure there are not more than maxEntityNumber entities
        .slice(0, maxEntityNumber);
}
