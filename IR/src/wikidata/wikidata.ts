import fetch from "node-fetch";
import logger from "../logger";
import path from "path";
import { ClassificationResult, WikiDataResult, WikiDataFields, KnownInstance } from "../models";
import 'wikibase-sdk';
import 'wikidata-sdk';

// eslint-disable-next-line
const wbk = require("wikidata-sdk");

enum WikidataPropertyType {
    Instanceof = "P31",
    // Painting / statue
    Creator = "P170",
    Genre = "P136",
    Movement = "P135",
    // Monument
    Architect = "P84",
    Architectural_style = "P149",
    /*painting = "Q3305213",
    sculpture = "Q860861",*/
    Location = "P625"
}

/**
 * Retrieve metadata from WikiData using the entityIds.
 */
export class WikiData {

    /**
     * Perform a WikiData search.
     *
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
     *
     * @param freebaseId Freebase id from the Google Image Vision API (coming from Classification module).
     * @returns {Promise<string>} The WikiData id.
     */
    public getWikiDataId(freebaseId: string): Promise<string> {

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
        const url = wbk.sparqlQuery(sparql);

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
     *
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

    /**
     * Retrieve Wikipedia name from Wikidata, given the language and the wikidata id
     * @param lang The language chosen by the user, gives the Wikipedia subdomain
     * @param wikidataId The WikiData id to look for
     */
    public getWikipediaName(lang: string, wikidataId: string): Promise<string> {
        const url = wbk.getEntities([wikidataId]);

        return fetch(url)
            .then(r => r.json())
            .then(content => content.entities[wikidataId].sitelinks[`${lang}wiki`].title);
    }

    public getKnownInstance(classificationResult: ClassificationResult): Promise<KnownInstance> {
        const language = classificationResult.userProfile.language;
        return Promise.all(
            classificationResult.classification.entities.map(entity => {
                return this.getProperties(entity.entityId, language)
                    .then(properties => {
                        // check if is known by looking for the presence of some properties
                        if (properties.Creator.length > 0 ||
                            properties.Architect.length > 0 ||
                            properties.Location.length > 0) {
                                properties.score = entity.score
                                return properties as KnownInstance
                            }
                        // not a know instance
                        return null
                    })
            })
        )
            .then(resArray => resArray.filter(res => res != null))
            .then(resArray => resArray.sort((a, b) => a.score - b.score))
            .then(resArray => resArray.length ? resArray[0] : null)
    }

    /**
     * Check if a Freebase id refers to a known instance or not.
     * @param freebaseId The Google webentities id
     * @returns {Promise<WikiDataFields>} that is populated if frebaseId refers to a known instance, null otherwise
    */
    public getProperties(freebaseId: string, language: string): Promise<any> {
        // translate freebaseId in WikiData id
        return this.getWikiDataId(freebaseId)
            .then(id => {
                if (!id) {
                    const err = new Error(`Unable to translate ${freebaseId} into WikiData ID`);
                    logger.error("[wikidata.ts] Error: ", err);
                    throw err;
                }
                // get the WikiData content for the entity
                return fetch(wbk.getEntities([id]))
                    .then(r => r.json())
                    .then(content => {
                        // simplify entities (https://github.com/maxlath/wikibase-sdk/blob/master/docs/simplify_entities_data.md#simplify-entities)
                        content.entities = wbk.simplify.entities(content.entities);

                        // contains the key of the enum => ["InstanceOf", "Creator", ...]
                        const properties = Object.keys(WikidataPropertyType).filter(k => Number.isNaN(Number(k)));

                        // Key is the WikiDataPropertyType, values are arrays of wikidata ids
                        const simplifiedEntities: {
                            [k: string]: Array<string>
                        } = {};

                        // for each entity id
                        for (let entityId in content.entities) {
                            // for each property we want to extract
                            properties.forEach(property => {
                                simplifiedEntities[property] = content.entities[entityId].claims[(WikidataPropertyType as any)[property]] || [];
                            });
                        };

                        // set also the Wikipedia page title
                        simplifiedEntities.WikipediaPageTitle = content.entities[id].sitelinks[`${language}wiki`].title;

                        return simplifiedEntities;
                    })
            });
    }



    /**
     * Retrieve expected fields from the WikiData page
     * @param freebaseId The Google webentities id
     * @returns {Promise<WikiDataFields>}
    */
    public getSimplifiedClaims(freebaseId: string): Promise<WikiDataFields> {
        return this.getWikiDataId(freebaseId).then(async id => {
            if (!id) {
                const err = new Error(`Unable to translate ${freebaseId} into WikiData ID`);
                logger.error("[wikidata.ts] Error: ", err);
                throw err;
            }
            const url = wbk.getEntities([id]);

            const content = await fetch(url)
                .then(r => r.json());

            // simplify entities (https://github.com/maxlath/wikibase-sdk/blob/master/docs/simplify_entities_data.md#simplify-entities)
            content.entities = wbk.simplify.entities(content.entities);

            // contains the key of the enum => ["InstanceOf", "Creator", ...]
            const properties = Object.keys(WikidataPropertyType).filter(k => Number.isNaN(Number(k)));


            /*
            * Key is the WikiDataPropertyType, values are arrays of wikidata ids
            */
            const simplifiedEntities: {
                [k: string]: Array<string>
            } = {};

            // for each entity id
            Object.keys(content.entities).forEach(entityId => {

                // for each property we want to extract
                properties.forEach(property => {
                    const simplifiedClaimsForProperty = content.entities[entityId].claims[(WikidataPropertyType as any)[property]]
                    simplifiedEntities[property] = simplifiedClaimsForProperty || [];
                });
            });

            const res: WikiDataFields = {
                Instanceof: simplifiedEntities.Instanceof,
                Creator: simplifiedEntities.Creator,
                Genre: simplifiedEntities.Genre,
                Movement: simplifiedEntities.Movement,
                Architect: simplifiedEntities.Architect,
                Architectural_style: simplifiedEntities.Architectural_style
            }

            return res;
        });
    }

}
