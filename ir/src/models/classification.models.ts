import { Entity } from "./entity.model";
import { UserProfile } from "./user-profile.model";

export interface Location extends Entity {
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

export interface Classification {
    entities: Array<Entity>;
    labels: Array<Entity>;
    locations: Array<Location>;
    safeSearch: SafeSearch;    
    style: Array<Entity>;
}

export interface ClassificationResult {
    userProfile: UserProfile;
    classification: Classification;
}
