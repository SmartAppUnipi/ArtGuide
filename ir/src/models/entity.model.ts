import { wikidataProperties } from "../../config.json";

export interface Entity {
    description: string;
    score: number;
    entityId: string;
}

/** Load available properties from config.json */
type WikidataEntity = {
    [k in keyof typeof wikidataProperties]: Array<string>;
};

export interface MetaEntity extends Entity, WikidataEntity {
    wikidataId: string;
    wikipediaPageTitle: string;
}