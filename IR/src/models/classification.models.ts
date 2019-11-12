import { UserProfile } from "./user-profile.model";

export interface BasicField {
  description: string;
  score: number;
}

export interface BasicFieldWithId extends BasicField {
  entityId: string;
}

export interface Location extends BasicFieldWithId {
  latitude: number;
  longitude: number;
}

export interface SafeSearch {
  adult: string;
  medical: string;
  racy: string;
  spoof: string;
  violence: string;
}

export interface Period extends BasicField {
  name: string;
}

export interface Classification {
  entities: BasicFieldWithId[];
  labels: BasicFieldWithId[];
  locations: Location[];
  safeSearch: SafeSearch;
  type: BasicField[];
  monumentType: BasicField[];
  period: Period[];
  style: BasicField[];
  materials: BasicField[];
}

export interface ClassificationResult {
  userProfile: UserProfile;
  classification: Classification;
}