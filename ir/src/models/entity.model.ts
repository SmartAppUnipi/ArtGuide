import { wikidataProperties } from "../../config.json";

export interface Entity {
    description: string;
    score: number;
    entityId: string;
}

/** Load available properties from config.json */
type WikiDataPropertiesEnum = {
    [k in keyof typeof wikidataProperties]: Array<string>;
}

export interface MetaEntity extends Entity, WikiDataPropertiesEnum {
    wikidataId: string;
    wikipediaPageTitle: string;
}