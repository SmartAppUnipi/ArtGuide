import path from 'path'
import fetch from 'node-fetch'
const wdk = require('wikidata-sdk')
import { logger } from '../logger'
import { ClassificationResult } from '../models'

/**
 * Retrieve metadata from WikiData using the entityIds.
 */
export class WikiData {

  /**
   * Convert a freebase id in a WikiData id.
   * @param freebaseId Freebase id from the Google Image Vision API (coming from Classification module).
   * @returns {Promise<string>} The WikiData id.
   */
  private getWikiDataId (freebaseId : string) : Promise<string> {

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
      LIMIT 1` 
  
    const url = wdk.sparqlQuery(sparql)
  
    try {
      return fetch(url).then(response => response.json()).then(json => {
        return path.basename(json.results.bindings[0].s.value)
      })
    } catch (e) {
      logger.error(`[wikidata.ts] Error: `, e)
      return null
    } 
  }

  /**
   * Extract metadata from WikiData.
   * @param freebaseId freebase id from the Google Image Vision API (coming from Classification module).
   * @returns WikiData output.
   */
  private queryWikiData(freebaseId : string) {
    return this.getWikiDataId(freebaseId).then(id => {
      if (!id) {
        const err = new Error(`Unable to translate ${freebaseId} into WikiData ID`)
        logger.error(`[wikidata.ts] Error: `, err)
        throw err
      }
      return fetch(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&format=json`)
        .then(response => response.json())
        .then(json => {
          // clean data
          return { 
            wdid: id, 
            descriptionEn: json.entities[id].descriptions.en,
            claims: json.entities[id].claims
          }
        })
    })
  }

  /**
   * Perform a WikiData search.
   * @param classificationResult The object received from the Classification module.
   * @returns {Promise<any>} A list of page results.
   */
  // TODO: return an object with type WikiDataResult (to be declared) instead of any
  public search(classificationResult : ClassificationResult) : Promise<any> {
    if (classificationResult.classification.entities && classificationResult.classification.entities.length)
      return this.queryWikiData(classificationResult.classification.entities[0].entityId)
    return Promise.resolve({})
  }

}
