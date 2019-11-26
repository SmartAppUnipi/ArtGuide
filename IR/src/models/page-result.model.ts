export interface PageSection {
  title: string;
  content: string;
}

export interface PageResult {
  url: string;
  title: string;
  sections: Array<PageSection>;
  keywords:Array<string>;
}