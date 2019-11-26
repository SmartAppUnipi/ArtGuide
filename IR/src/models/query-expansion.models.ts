export interface QueryExpansionRequest {
  userId: number;
  userTastes: string[];
  language: string;
}

export interface KeywordExpansion {
  [keyword: string]: string[];
}

export interface QueryExpansionResponse {
  userId: number;
  userTastes: string[];
  keywordExpansion: KeywordExpansion;
  language: string;
}

export interface QueryBuildResult {
  originalQuery: string,
  expandedKeywords: Array<string>
}