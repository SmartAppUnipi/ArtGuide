import "wikibase-sdk";
import "wikidata-sdk";
import fetch from "node-fetch";
import logger from "../logger";
import path from "path";
import { ClassificationResult, KnownInstance, WikiDataProperties } from "../models";

// eslint-disable-next-line
const wbk = require("wikidata-sdk");

enum WikidataPropertyType {
    Instanceof = "P31",
    // Painting/monument/statue
    Creator = "P170",
    Genre = "P136",
    Movement = "P135",
    // Architecture
    Architect = "P84",
    ArchitecturalStyle = "P149",
    // Architectures and in-museum-located painting and monuments
    Location = "P625"
}

/**
 * Retrieve metadata from WikiData using the entityIds.
 */
export class WikiData {

    /**
     * Retrieve Wikipedia page name from WikiData given the entity id.
     *
     * @param freebaseId The freebaseId id to look for.
     * @param lang The language code, ie. the Wikipedia subdomain to search in.
     * @returns The Wikipedia page name.
     */
    public getWikipediaName(freebaseId: string, lang: string): Promise<string> {
        // translate freebaseId in WikiData id
        return this.getWikiDataId(freebaseId)
            .then(wikidataId => {
                const url = wbk.getEntities([wikidataId]);
                return fetch(url)
                    .then(r => r.json())
                    .then(content => content.entities[wikidataId].sitelinks[`${lang}wiki`].title);
            });
    }


    /**
     * Check if a Freebase id refers to a known instance or not.
     * 
     * @param classificationResult The classification result, optionally filtered.
     * @returns A KnownInstance object if is a known instance or null otherwise.
     */
    public getKnownInstance(classificationResult: ClassificationResult): Promise<KnownInstance> {
        const language = classificationResult.userProfile.language;
        return Promise.all(
            classificationResult.classification.entities.map(entity => {
                return this.getProperties(entity.entityId, language)
                    .then(properties => {
                        const knownInstance = properties as any as KnownInstance;
                        // check if is known by looking for the presence of some properties
                        if (knownInstance.Creator.length > 0 ||
                            knownInstance.Architect.length > 0 ||
                            knownInstance.Location.length > 0) {
                            knownInstance.score = entity.score;
                            return knownInstance;
                        }
                        // not a know instance
                        return null;
                    });
            })
        )
            .then(resArray => resArray.filter(res => res != null))
            .then(resArray => resArray.sort((a, b) => b.score - a.score))
            .then(resArray => resArray.length ? resArray[0] : null);
    }


    /**
     * Convert a freebase id in a WikiData id.
     *
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
            LIMIT 1
        `;
        const url = wbk.sparqlQuery(sparql);
        return fetch(url)
            .then(response => response.json())
            .then(json => {
                return path.basename(json.results.bindings[0].s.value);
            })
            .catch(/* istanbul ignore next */ ex => {
                const err = new Error(`Unable to translate the freebaseId ${freebaseId} into a WikiDataID. ${ex}`);
                logger.warn("[wikidata.ts] ", err);
                throw err;
            });
    }

    /**
     * Return the properties of 
     *
     * @param freebaseId The freebaseId id to look for.
     * @param language The language code, ie. the Wikipedia subdomain to search in.
     * @returns An object with some fields from WikiData.
     */
    private getProperties(freebaseId: string, language: string): Promise<WikiDataProperties> {
        // translate freebaseId in WikiData id
        return this.getWikiDataId(freebaseId)
            .then(wikidataId => {
                // get the WikiData content for the entity
                return fetch(wbk.getEntities([wikidataId]))
                    .then(r => r.json())
                    .then(content => {
                        // eslint-disable-next-line
                        // simplify entities (https://github.com/maxlath/wikibase-sdk/blob/master/docs/simplify_entities_data.md#simplify-entities)
                        content.entities = wbk.simplify.entities(content.entities);

                        // Key is the WikiDataPropertyType, values are arrays of wikidata ids
                        const simplifiedEntities = new WikiDataProperties();

                        // for each entity id
                        for (let entityId in content.entities) {
                            // for each property we want to extract
                            for (let enumKey in WikidataPropertyType) {
                                // enum => ["InstanceOf", "Creator", ...]
                                const claimName = enumKey as keyof typeof WikidataPropertyType;
                                simplifiedEntities[claimName] =
                                    content.entities[entityId].claims[WikidataPropertyType[claimName]] || [];
                            }
                        }

                        // set also the Wikipedia page title
                        simplifiedEntities.WikipediaPageTitle =
                            content.entities[wikidataId].sitelinks[`${language}wiki`];

                        return simplifiedEntities;
                    });
            })
            .catch(/* istanbul ignore next */ ex => {
                logger.warn("[wikidata.ts] ", ex);
                return Promise.resolve(new WikiDataProperties({}));
            });
    }

}
