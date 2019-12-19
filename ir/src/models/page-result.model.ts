import { Query } from "./query.models";

export interface PageSection {
    title: string;
    content: string;
    tags: Array<string>;
    score: number;
}

export interface PageResult extends Query {
    url: string;
    title: string;
    sections: Array<PageSection>;
    tags: Array<string>;
    summary?: string;
}
