export interface PageSection {
    title: string;
    content: string;
    tags: Array<string>;
}

export class PageResult {
    public url: string;
    public title: string;
    public sections: Array<PageSection>;
    public keywords: Array<string>;
    public tags: Array<string>;
    public summary?: string;
    public score: number;

    constructor(item?: Partial<PageResult>) {

        const defaults = {
            keywords: [],
            score: 0,
            sections: [],
            summary: "",
            tags: [],
            title: "",
            url: ""
        } as PageResult;

        Object.assign(this, defaults, item || {});
    }
}
