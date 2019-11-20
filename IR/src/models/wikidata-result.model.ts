export interface WikiDataResult {
    id: string;
    descriptionEn: string;
    claims: string;
}

export interface WikiDataFields {
    instanceof: [];
    creator?: string;
    genre?: string;
    movement?: string;
    architect?: string;
    architectural_style?: string;
}