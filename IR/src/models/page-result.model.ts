export interface PageSection {
  title: string;
  content: string;
  tags: Array<string>;
}

export class PageResult {
  url: string;
  title: string;
  sections: Array<PageSection>;
  keywords: Array<string>;
  tags: Array<string>;

  constructor(item: Partial<PageResult>) {
    if (item)
      Object.assign(this, item);
  }
}