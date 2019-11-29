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

    constructor(item: Partial<PageResult>) {
        if (item) {
            // mu
            Object.assign(this, item);
        }
    }
}
