import { post } from "./utils"
import { AdaptationEndpoint } from "./environment"
import { ClassificationResult, QueryExpansionResponse } from "./models"


interface QueryBuildResult {
  originalQuery: string,
  expandedKeywords: Array<string>
}


/**
 * Builds a basic query basing on the CLassification module result.
 * @param classificationResult The object received from the Classification module.
 * @returns {string} A basic query string.
 */
function buildBasicQuery(classificationResult: ClassificationResult) : string {
  // FIXME: return a meaningful query
  return classificationResult.classification.entities[0].description
}

/**
 * 
 * @param query A string representing basic query.
 * @param queryExpansion The query expansion provided by the Adaptation module.
 * @returns {Array<QueryBuildResult>} An array of object containing the originalQuery and an array expandedKeywords.
 */
function extendQuery(query : string, queryExpansion : QueryExpansionResponse) : Array<QueryBuildResult> {
  const queries: Array<QueryBuildResult> = []

  Object.keys(queryExpansion.keywordExpansion).forEach(keyExpansion => {
    const keywords = queryExpansion.keywordExpansion[keyExpansion] as Array<string>
    queries.push({
      originalQuery: query,
      expandedKeywords: keywords
    })
  })

  return queries
}

/**
 * Build an array of queries using the query expansion provided by the Adaptation module.
 * @param classificationResult The object received from the Classification module.
 * @returns {Promise<Array<QueryBuildResult>>} A promise resolved with the array of queries of type QueryBuildResult.
 */
async function buildQuery(classificationResult: ClassificationResult): Promise<Array<QueryBuildResult>> {
  // build the basic query using the Classification result
  const basicQuery = buildBasicQuery(classificationResult)
  // get the query expansion from the Adaptation module
  return post<QueryExpansionResponse>(
    AdaptationEndpoint + "/keywords",
    // FIXME: change this format to match userProfile
    {
      uTastes: classificationResult.userProfile.tastes
    }
  )
  // extend the basic query with the query expansion
  .then(queryExpansion => extendQuery(basicQuery, queryExpansion))
}


export {
  buildQuery
}