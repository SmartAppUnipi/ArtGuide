import * as wd from "wikidata-sdk";
import { Entity } from "src/models";
import fetch from "node-fetch";
import logger from "../logger";
import { MetaEntity } from "../models";
import path from "path";
import { knownInstanceProperties, wikidataArtEntities, wikidataProperties } from "../../config.json";



/**
 * Retrieve metadata from WikiData using the entityIds.
 */
export class WikiData {

    /**
     * Retrieve metadata from an entity.
     *
     * @param entity The entity to look for.
     * @param language The language code, ie. the Wikipedia subdomain to search in.
     * @returns An object with some fields from WikiData.
     */
    public getProperties(entity: Entity, language: string): Promise<MetaEntity> {
        // translate freebaseId in WikiData id
        return this.getWikiDataId(entity)
            .then(wikidataId => {
                // prepare the wikidata object and se the id
                const wikidataEntity = entity as MetaEntity;
                wikidataEntity.wikidataId = wikidataId;
                // get the WikiData content for the entity
                return fetch(wd.getEntities([wikidataId]))
                    .then(r => r.json())
                    .then(content => {
                        // eslint-disable-next-line
                        // simplify entities (https://github.com/maxlath/wikibase-sdk/blob/master/docs/simplify_entities_data.md#simplify-entities)
                        content.entities = wd.simplify.entities(content.entities);

                        // for each entity returned by wd.getEntities([wikidataId])
                        for (const entityId in content.entities) {
                            // for each property we want to extract
                            for (const enumKey in wikidataProperties) {
                                // enumKey = ["instanceOf", "creator", ...]
                                const claimName = enumKey as keyof typeof wikidataProperties;
                                wikidataEntity[claimName] =
                                    content.entities[entityId].claims[wikidataProperties[claimName]] ?? [];
                            }
                        }

                        // set also the Wikipedia page title
                        wikidataEntity.wikipediaPageTitle =
                            content.entities[wikidataId].sitelinks[`${language}wiki`];

                        return wikidataEntity;
                    });
            })
            .catch(/* istanbul ignore next */ ex => {
                logger.warn("[wikidata.ts] ", ex);
                return Promise.resolve({} as MetaEntity);
            });
    }

    /**
     * Check if there is a meta entity that is an instance of a known entity.
     *
     * @param metaEntities The entities with WikiData properties.
     * @param language The language code, ie. the Wikipedia subdomain to search in.
     * @returns The first meta entity that is a known instance or null if there are none.
     */
    public tryGetKnownInstance(metaEntities: Array<MetaEntity>, language: string): Promise<MetaEntity> {
        // foreach meta entity
        for (const metaEntity of metaEntities) {
            // if the meta entity has one of the knownInstanceProperties, then is a known entity
            for (const property of knownInstanceProperties) {
                if (metaEntity[property] && metaEntity[property].length) {
                    // fill its knownInstanceProperties with the Wikipedia names of the properties
                    return this.setWikipediaNames(metaEntity, language);
                }
            }
        }
        // no known instance found
        return Promise.resolve(null);
    }

    /**
     * Given a known entity, replace all the property ids with the corresponding Wikipedia page titles.
     *
     * @param knownInstance The known instance to be populated.
     * @param language The language code, ie. the Wikipedia subdomain to search in.
     * @returns the improved known entity.
     */
    private setWikipediaNames(knownInstance: MetaEntity, language: string): Promise<MetaEntity> {
        const promises = [];
        for (const property of knownInstanceProperties as Array<string>) {

            // the current property does not exist, skip the call to populate it
            if (!knownInstance[property] || !Array.isArray(knownInstance[property]) || !knownInstance[property].length)
                continue;

            /*
             * else populate the id with the name. 
             * Note that knownInstance[property] is an array of ids
             */
            promises.push(
                Promise.all(
                    (knownInstance[property as keyof typeof wikidataProperties]).map(wikidataPropertyId => {
                        return this.getWikipediaName(wikidataPropertyId, language);
                    })
                ).then(propertiesNames => {
                    knownInstance[property] = propertiesNames;
                })
            );
        }
        return Promise.all(promises)
            .then(() => knownInstance);
    }

    /**
     * Removes from a list the entities that are not related to arts.
     * It uses wikidata to retrieve the tree of InstanceOf and SubClassOf of the entity and look for a match.
     *
     * @param metaEntities The list of entities to be filtered out.
     * @returns The filtered entities array.
     */
    public filterNotArtRelatedResult(metaEntities: Array<MetaEntity>): Promise<Array<MetaEntity>> {
        // filter the entities
        return Promise.all(metaEntities.map(metaEntity => {
            if (!metaEntity) return;
            // if the entity description is not an art instance discard the entity directly
            if (wikidataArtEntities.exclude.includes(metaEntity.description?.toLocaleLowerCase()))
                return Promise.resolve(null);
            // if the entity description is an art instance keep the entity
            if (wikidataArtEntities.include.includes(metaEntity.description?.toLocaleLowerCase()))
                return Promise.resolve(metaEntity);
            // otherwise get the root path of the entity, ie. the list of all its instance of and subclass properties
            return this.getEntityRootPath(metaEntity.wikidataId)
                .then(roots => {
                    // if at least one of root path is not wanted drop the entity
                    for (const root of roots) {
                        if (wikidataArtEntities.exclude.includes(root.toLocaleLowerCase()))
                            return null;
                    }
                    // if at least one root path is wanted keep the entity
                    for (const root of roots) {
                        if (wikidataArtEntities.include.includes(root.toLocaleLowerCase()))
                            return metaEntity;
                    }
                    // else remove it (is not unwanted, but neither wanted)
                    return null;
                });
        }))
            // remove null entities
            .then(metaEntities => metaEntities.filter(metaEntity => metaEntity != null));
    }

    /**
     * Retrieve Wikipedia page name from WikiData given the entity id.
     *
     * @param wikidataId The wikidata entity id to look for.
     * @param lang The language code, ie. the Wikipedia subdomain to search in.
     * @returns The Wikipedia page name.
     */
    public getWikipediaName(wikidataId: string, lang: string): Promise<string> {
        const url = wd.getEntities([wikidataId]);
        return fetch(url)
            .then(r => r.json())
            .then(content => content.entities[wikidataId].sitelinks[`${lang}wiki`].title);
    }

    /**
     * Convert a freebase id in a WikiData id.
     *
     * @param entity The entity with the freebase id from the Google Image Vision API (coming from Classification).
     * @returns {Promise<string>} The WikiData id.
     */
    private getWikiDataId(entity: Entity): Promise<string> {
        // skip if already present
        if (entity.wikidataId)
            return Promise.resolve(entity.wikidataId);

        const freebaseId = entity.entityId;
        
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
        const url = wd.sparqlQuery(sparql);
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
     * Given a WikiData entity returns the list of the labels for properties
     *'InstanceOf' (P31) and 'SubClassOf' (P279) until the WikiData root.
     *
     *This function exploits SparQL to perform a single HTTP request.
     *
     *The returned list is unordered.
     *
     * @param wikidataId The WikiData entity id.
     * @returns An array with the labels corresponding to the properties values
     * (eg. for Pisa Tower => `["bell tower", "tower", "architectural structure", "work", "construction", ... ]`)
     */
    private getEntityRootPath(wikidataId: string): Promise<Array<string>> {
        /*
         * InstanceOf = P31
         * SubClass = P279
         */
        const sparql = `
                SELECT ?entity ?entityLabel WHERE {
                    wd:${wikidataId} wdt:P31*/wdt:P279*/wdt:P106* ?val.
                    ?val wdt:P31*/wdt:P279*/wdt:P106* ?entity
                    SERVICE wikibase:label {
                        bd:serviceParam wikibase:language "en" .
                    }
                } group by ?entity ?entityLabel
            `;

        const url = wd.sparqlQuery(sparql);

        return fetch(url)
            .then(r => r.json())
            .then(tree => {

                const labels = tree.results.bindings
                    .map((b: any) => b.entityLabel.value) as Array<string>;

                // if the entityId is invalid, the query returns ["entityId"]
                if (labels &&
                    labels.length == 1 &&
                    labels[0] == wikidataId) {
                    // I return empty array instead
                    return [];
                }

                return labels;

            })
            .catch(/* istanbul ignore next */ ex => {
                logger.error("[wikidata.ts] getEntityRootPath(): Error: ", ex);
                return [];
            });
    }

}
