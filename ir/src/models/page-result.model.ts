export interface PageSection {
    title: string;
    content: string;
    tags: Array<string>;
    score: number;
}

export interface PageResult {
    url: string;
    title: string;
    sections: Array<PageSection>;
    keywords: Array<string>;
    tags: Array<string>;
    summary?: string;
    score: number;
}
