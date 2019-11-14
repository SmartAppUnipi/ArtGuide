import fetch from "node-fetch";
import logger from "./logger";

/**
 * Perform a POST request to a specified endpoint with a custom json in the body.
 * @param url Url (string) of the POST request. Must include the protocol and the port if different from the default.
 * @param body A JS object that will be stringified and sent as a JSON.
 * @returns {Promise<T>} A promise resolved with the received JSON parsed as JS object of type T.
 */
function post<T = any>(url: string, body: any): Promise<T> {
    logger.silly("[utils.ts] New post request:" + url);
    return fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
    }).then(res => res.json());
}

export {
    post
};
