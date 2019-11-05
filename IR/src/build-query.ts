import { post } from "./utils"
import { AdaptationEndpoint } from "./environment"
import { ClassificationResult, QueryExpansionResponse } from "./models"

interface QueryBuildResult {
  originalQuery: string; 
  expandedKeywords: Array<string>;
}

async function buildQuery(classificationResult: ClassificationResult): Promise<Array<QueryBuildResult>> {

  const queryExpansion = await post<QueryExpansionResponse>(
    AdaptationEndpoint + "/keywords",
    {
      uTastes: classificationResult.userProfile.tastes
    }
  );

  const queries: Array<QueryBuildResult> = [];
  const originalQueryKeywords = classificationResult.classification.entities[0].description;

  Object.keys(queryExpansion.keywordExpansion).forEach(keyExpansion => {
    const keywords = queryExpansion.keywordExpansion[keyExpansion] as Array<string>
    queries.push({
      originalQuery: originalQueryKeywords,
      expandedKeywords: keywords
    });
  });

  return queries;
}

export {
  buildQuery
}