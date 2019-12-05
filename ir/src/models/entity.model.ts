export interface Entity {
    description: string;
    score: number;
    entityId: string;
}

export interface MetaEntity extends Entity {
    wikidataId: string;
    wikipediaPageTitle: string;
    instanceof: Array<string>;
    creator: Array<string>;
    genre: Array<string>;
    movement: Array<string>;
    architect: Array<string>;
    architecturalStyle: Array<string>;
    location: Array<string>;
}