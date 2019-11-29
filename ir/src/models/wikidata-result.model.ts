export class WikiDataProperties {
    Instanceof: Array<string>;
    Creator: Array<string>;
    Genre: Array<string>;
    Movement: Array<string>;
    Architect: Array<string>;
    ArchitecturalStyle: Array<string>;
    Location: Array<string>;
    WikipediaPageTitle: string;

    constructor(item?: Partial<WikiDataProperties>) {

        const defaults = {
            Instanceof: [],
            Creator: [],
            Genre: [],
            Movement: [],
            Architect: [],
            ArchitecturalStyle: []
        } as WikiDataProperties;

        Object.assign(this, defaults, item || {});
    }
}

export interface KnownInstance extends WikiDataProperties {
    score: number;
}