export interface WikiDataResult {
    id: string;
    descriptionEn: string;
    claims: string;
}

export interface WikiDataFields {
    Instanceof: Array<string>;
    Creator: Array<string>;
    Genre: Array<string>;
    Movement: Array<string>;
    Architect: Array<string>;
    Architectural_style: Array<string>;
}