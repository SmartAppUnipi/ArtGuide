import fetch from "node-fetch";
import logger from "../logger";
import path from "path";
import wdk from "wikidata-sdk";
import { ClassificationResult, WikiDataResult } from "../models";

/**
 * Retrieve metadata from WikiData using the entityIds.
 */
export class WikiData {

    /**
     * Perform a WikiData search.
     * @param classificationResult The object received from the Classification module.
     * @returns {Promise<WikiDataResult>} A WikiData result or @type {null} if there are no entities.
     */
    public search(classificationResult: ClassificationResult): Promise<WikiDataResult> {
        if (classificationResult.classification.entities && classificationResult.classification.entities.length) {
            try {
                return this.queryWikiData(classificationResult.classification.entities[0].entityId);
            } catch (ex) {
                logger.warn("[wikidata.ts] Caught exception: ", ex);
                return Promise.resolve(null);
            }
        }
        return Promise.resolve(null);
    }

    /**
     * Convert a freebase id in a WikiData id.
     * @param freebaseId Freebase id from the Google Image Vision API (coming from Classification module).
     * @returns {Promise<string>} The WikiData id.
     */
    private getWikiDataId(freebaseId: string): Promise<string> {

        const sparql = `
    PREFIX wd: <http://www.wikidata.org/entity/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    PREFIX wikibase: <http://wikiba.se/ontology#>
    SELECT ?s WHERE {
     ?s ?p ?o .
     ?s wdt:P646 "${freebaseId}" .
     SERVICE wikibase:label {
       bd:serviceParam wikibase:language "en" .
     }
    }
    LIMIT 1`;
        const url = wdk.sparqlQuery(sparql);

        try {
            return fetch(url)
                .then(response => response.json())
                .then(json => {
                    return path.basename(json.results.bindings[0].s.value);
                });
        } catch (e) {
            logger.error("[wikidata.ts] Error: ", e);
            return null;
        }
    }

    /**
     * Extract metadata from WikiData.
     * @param freebaseId freebase id from the Google Image Vision API (coming from Classification module).
     * @returns WikiData output.
     * @throws {Error} if it is not possible to translate the freebase id in a WikiData id.
     */
    private queryWikiData(freebaseId: string): Promise<WikiDataResult> {
        return this.getWikiDataId(freebaseId).then(id => {
            if (!id) {
                const err = new Error(`Unable to translate ${freebaseId} into WikiData ID`);
                logger.error("[wikidata.ts] Error: ", err);
                throw err;
            }
            return fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&format=json`)
                .then(response => response.json())
                .then(json => {
                    // clean data
                    return {
                        id: id,
                        descriptionEn: json.entities[id].descriptions.en,
                        claims: json.entities[id].claims
                    };
                });
        });
    }

}
