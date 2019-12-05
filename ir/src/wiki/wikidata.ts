import * as wbk from "wikidata-sdk";
import { Entity } from "src/models";
import fetch from "node-fetch";
import logger from "../logger";
import { MetaEntity } from "../models";
import path from "path";
import { wikidataArtEntities } from "../../config.json";


enum WikidataPropertyType {
    instanceof = "P31",
    // Painting/monument/statue
    creator = "P170",
    genre = "P136",
    movement = "P135",
    // Architecture
    architect = "P84",
    architecturalStyle = "P149",
    // Architectures and in-museum-located painting and monuments
    location = "P625"
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
     * Check if there is a meta entity that is an instance of a known entity.
     *
     * @param metaEntities The entities with WikiData properties.
     * @returns The first meta entity that is a known instance or null if there are none.
     */
    public tryGetKnownInstance(metaEntities: Array<MetaEntity>): MetaEntity {
        for (const metaEntity of metaEntities) {
            if (metaEntity.creator?.length > 0 ||
                metaEntity.architect?.length > 0 ||
                metaEntity.location?.length > 0)
                return metaEntity;
        }
        return null;
    }

    /**
     * Removes from a list the entities that are not related to arts.
     * It uses wikidata to retrieve the tree of InstanceOf and SubClassOf of the entity and look for a match.
     *
     * @param entities The list of entities to be filtered out.
     * @returns The filtered entities array.
     */
    public filterNotArtRelatedResult(entities: Array<MetaEntity>): Promise<Array<MetaEntity>> {
        // filter the entities
        return Promise.all(entities.map(metaEntity => {
            // if the entity description is not an art instance discard the entity directly
            if (wikidataArtEntities.exclude.includes(metaEntity.description.toLocaleLowerCase()))
                return null;
            // if the entity description is an art instance keep the entity
            if (wikidataArtEntities.include.includes(metaEntity.description.toLocaleLowerCase()))
                return metaEntity;
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
     * Retrieve metadata from an entity.
     *
     * @param entity The entity to look for.
     * @param language The language code, ie. the Wikipedia subdomain to search in.
     * @returns An object with some fields from WikiData.
     */
    public getProperties(entity: Entity, language: string): Promise<MetaEntity> {
        // translate freebaseId in WikiData id
        return this.getWikiDataId(entity.entityId)
            .then(wikidataId => {
                // prepare the wikidata object and se the id
                const wikidataProperties = entity as MetaEntity;
                wikidataProperties.wikidataId = wikidataId;
                // get the WikiData content for the entity
                return fetch(wbk.getEntities([wikidataId]))
                    .then(r => r.json())
                    .then(content => {
                        // eslint-disable-next-line
                        // simplify entities (https://github.com/maxlath/wikibase-sdk/blob/master/docs/simplify_entities_data.md#simplify-entities)
                        content.entities = wbk.simplify.entities(content.entities);

                        /*
                         * Key is the WikiDataPropertyType, values are arrays of wikidata ids
                         * for each entity id
                         */
                        for (const entityId in content.entities) {
                            // for each property we want to extract
                            for (const enumKey in WikidataPropertyType) {
                                // enum => ["InstanceOf", "Creator", ...]
                                const claimName = enumKey as keyof typeof WikidataPropertyType;
                                wikidataProperties[claimName] =
                                    content.entities[entityId].claims[WikidataPropertyType[claimName]] || [];
                            }
                        }

                        // set also the Wikipedia page title
                        wikidataProperties.wikipediaPageTitle =
                            content.entities[wikidataId].sitelinks[`${language}wiki`];

                        return wikidataProperties;
                    });
            })
            .catch(/* istanbul ignore next */ ex => {
                logger.warn("[wikidata.ts] ", ex);
                return Promise.resolve({} as MetaEntity);
            });
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
                    wd:${wikidataId} wdt:P31*/wdt:P279* ?val.
                    ?val wdt:P31*/wdt:P279* ?entity
                    SERVICE wikibase:label {
                        bd:serviceParam wikibase:language "en" .
                    }
                } group by ?entity ?entityLabel
            `;

        const url = wbk.sparqlQuery(sparql);

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
            .catch(ex => {
                logger.error("[wikidata.ts] getEntityRootPath(): Error: ", ex);
                return [];
            });
    }

}
