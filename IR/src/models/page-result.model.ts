export interface PageSection {
    title: string;
    content: string;
    tags: string[];
}

export class PageResult {
    public url: string;
    public title: string;
    public sections: PageSection[];
    public keywords: string[];
    public tags: string[];

    constructor(item: Partial<PageResult>) {
        if (item) {
            // mu
            Object.assign(this, item);
        }
    }
}
