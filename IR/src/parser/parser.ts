import { JSDOM } from "jsdom";
import { PageResult } from "../models";

// eslint-disable-next-line
const rake = require("rake-js").default;

export class Parser {

    private querySelectors = [
        /*
         * "#content",
         * ".content",
         * "#container",
         * ".container",
         * "[id*='container']",
         * "[class*='container']",
         */
        ".mw-headline",
        "p",
        "h1",
        "h2",
        "h3"
    ];

    private sectionSelectors = [
      "p"
    ]

    /*
     * This method is used to remove the code inside { } that could be found in the parse text.
     * It counts the number of consecutive open bracket { and store the position of the first
     * When the number of closed bracket } is equal to the number of open bracket, it deletes
     * all the text between the bracket
     */
    public removeCodeInText(_text: string): string {
        let text = _text;
        let nOpenBracket = 0;
        let nClosedBracket = 0;
        let i = 0;
        let positionFirstBracket = 0;
        let positionLastBracket = 0;
        while (i < text.length) {
            if (text[i] === "{") {
                nOpenBracket++;
                if (nOpenBracket === 1)
                    positionFirstBracket = i;

            } else if (text[i] === "}") {
                nClosedBracket++;
                if (nClosedBracket === nOpenBracket) {
                    positionLastBracket = i;
                    const deletionText = text.slice(positionFirstBracket, positionLastBracket + 1);
                    text = text.replace(deletionText, " ");
                    /*
                     * FIXME: log properly
                     * console.log(deletionText);
                     */
                    nOpenBracket = 0;
                    nClosedBracket = 0;
                    positionLastBracket = 0;
                    positionLastBracket = 0;
                }
            }
            i++;
        }
        /*
         * FIXME: log properly
         * console.log(nOpenBracket)
         */
        return text;
    }

    // This method append all selectors in one string to pass to the query selector
    public getAllSelectors(): string {
        let i = 0;
        let allSelectors = "";
        while (i < this.querySelectors.length - 1) {
            allSelectors += this.querySelectors[i] + ",";
            i++;
        }

        allSelectors += this.querySelectors[this.querySelectors.length - 1];

        return allSelectors;
    }

    // This method is based on intersection with the merge approacch.
    // It takes two text that should be similar. 
    // In our case :
    // - text1 is the complete text.
    // - text2 is the text without the titles.
    // Using the merge approacch when the two text are different means that
    // we found a word of the title of one section.
    // In this way we can extract the different sections with their title.
    public mergeText(text1: string[], text2: string[]) {
      let i = 0;
      let areEqual = false
      var sections = [];
      var titles = [];
      let nSections = 0;
      let index1 = 0;
      let index2 = 0;
      let text1Length = text1.length
      let text2Length = text2.length
      while( index1 < text1Length ) {
        if(text1[index1] == text2[index2]) {
          if (!sections[nSections]) { 
            sections[nSections] = "";
        }
          sections[nSections] += text1[index1] + " ";
          index1 ++;
          index2 ++;
          areEqual = true
        } else {
          if (areEqual == true) {
            nSections ++;
          }
          if (!titles[nSections]) { 
            titles[nSections] = "";
          }
          areEqual = false;
          titles[nSections] += text1[index1] + " ";
          index1 ++;
        }
      }
      return [titles, sections]
    }

  
    // Methods for getting sections and their title
    public async getTitlesAndSections(url: string) {
      let testoWithTitle = await this.parseToText(url, this.getAllSelectors())
      let testoWithoutTitles = await this.parseToText(url, this.sectionSelectors[0])
      var testoWithTitleTokenized = testoWithTitle.split(" ");
      var testoWithoutTitlesTokenied = testoWithoutTitles.split(" ");
      var titlesAndSections = this.mergeText(testoWithTitleTokenized,testoWithoutTitlesTokenied);
      var titles = titlesAndSections[0]
      var sections = titlesAndSections[1]
      var sectionsObj = []
      var i,j = 0;
      for (i = 0; i < sections.length; i++) { 
        if (sections[i].length > 20) {
          sectionsObj[j] = {
            title: titles[i],
            content: sections[i],
            tags: rake(sections[i]).slice(0,10)
          };
          j++;
        }
      }
      return sectionsObj
    }


    // Used for extract the text using some defined selectors
    public parseToText(url: string, selectors: string): Promise<string> {
      return JSDOM.fromURL(url).then(dom => {
        // look for a list of preferred query selectors
        let textContent = "";
        let content;
        /*
         * const i = 0;
         * nodesToRemove = dom.window.document.querySelectorAll('a')
         * for (i = 0; i < nodesToRemove.length; i++) {
         *   console.log(nodesToRemove[i].textContent)
         *   nodesToRemove[i].textContent = "";
         * }
         * i = 0;
         */
        const nodes = dom.window.document.querySelectorAll(selectors);
        /*
         * while (i < this.querySelectors.length)
         * if no nodes are found choose the body}
         */
        if (!nodes.length) {
            content = dom.window.document.body;
            textContent = content.textContent;
        } else {
            nodes.forEach(item => {
                const nodeText = item.textContent.replace(/\s+/g, " ").trim();
                textContent += nodeText + " ";

            });
        }


        const finalText = this.removeCodeInText(textContent)
        const keywords = rake(finalText).slice(0,10)

        return finalText
    })
  }

    public async parse(url: string): Promise<PageResult> {
        // FIXME: catch "Error: Could not parse CSS stylesheet" by jsdom
        return JSDOM.fromURL(url).then(async dom => {
            // look for a list of preferred query selectors
            let textContent = "";
            let content;
            /*
             * const i = 0;
             * nodesToRemove = dom.window.document.querySelectorAll('a')
             * for (i = 0; i < nodesToRemove.length; i++) {
             *   console.log(nodesToRemove[i].textContent)
             *   nodesToRemove[i].textContent = "";
             * }
             * i = 0;
             */
            const nodes = dom.window.document.querySelectorAll(this.getAllSelectors());
            /*
             * while (i < this.querySelectors.length)
             * if no nodes are found choose the body}
             */
            if (!nodes.length) {
                content = dom.window.document.body;
                textContent = content.textContent;
            } else {
                nodes.forEach(item => {
                    const nodeText = item.textContent.replace(/\s+/g, " ").trim();
                    if (nodeText.length > 40)
                        textContent += nodeText;

                });
            }


            const finalText = this.removeCodeInText(textContent)
            const keywords = rake(finalText).slice(0,10)
/*             var sectionObject = await this.getTitlesAndSections(url)
            if (sectionObject.length > 1) {
              return new PageResult({
                url,
                title: dom.window.document.title,
                sections: sectionObject,
                keywords: [], // keywords are populated from caller which knows the query object
                tags: [] // FIXME: populate with some logic (eg metadata keyword tag in html header)
            });
            } else { */
              return new PageResult({
                url,
                title: dom.window.document.title,
                sections: [
                    {
                        title: "main",
                        content: finalText,
                        tags: [keywords] // FIXME: populate with some logic if possible
                    }
                ],
                keywords: [], // keywords are populated from caller which knows the query object
                tags: [] // FIXME: populate with some logic (eg metadata keyword tag in html header)
            });
            //}
        });
      
    }

    /*
     * public parse(url: string): Promise<PageResult> {
     *   return JSDOM.fromURL(url).then(dom => {
     *     // look for a list of preferred query selectors
     *     let content, nodes, i = 0
     *     do nodes = dom.window.document.querySelectorAll(this.querySelectors[i++])
     *     while (!nodes.length && i < this.querySelectors.length)
     *     // if no nodes are found choose the body
     *     if (!nodes.length) content = dom.window.document.body
     *     // if is found exactly one node, choose that one
     *     else if (nodes.length == 1) content = nodes[0]
     *     // if more nodes are found, pick the one with longest HTML inside
     *     else content = [...nodes].reduce((a, b) => a.innerHTML.length > b.innerHTML.length ? a : b)
     *     // remove all the redundant spaces
     *     const textContent = content.textContent.replace(/\s+/g, ' ').trim()
     */

    /*
     *     return {
     *       url: url,
     *       title: dom.window.document.title,
     *       sections: [
     *         {
     *           title: "main",
     *           content: textContent
     *         }
     *       ],
     *       keywords: []
     *     }
     */

    /*
     *   })
     * }
     */

}


// FIXME: move tests in tests/parsers.spec.ts
/* eslint-disable */
/*
const urls = [
  "https://www.studenti.it/la-gioconda-leonardo-da-vinci.html",
  "http://www.ansa.it/canale_saluteebenessere/notizie/stili_di_vita/2019/01/09/leffetto-monna-lisa-esiste-ma-non-nella-gioconda_e1b96e6e-cf5b-42c1-a53d-b688e7ffb846.html",
  "https://www.focus.it/cultura/storia/gioconda-monna-lisa-furto",
  "https://www.artribune.com/arti-visive/arte-moderna/2019/07/ristrutturazione-sala-ospita-gioconda-tela-spostata/"
]
new Parser().parse(urls[0]).then(console.log)
*/
