import { JSDOM } from "jsdom"
import { PageResult } from '../models'


export class Parser {

  private querySelectors = [
    // "#content",
    // ".content",
    // "#container",
    // ".container",
    // "[id*='container']",
    // "[class*='container']",
    ".mw-headline",
    "p",
    "h2"
  ]

  // This method is used to remove the code inside { } that could be found in the parse text.
  // It counts the number of consecutive open bracket { and store the position of the first
  // When the number of closed bracket } is equal to the number of open bracket, it deletes
  // all the text between the bracket
  public removeCodeInText(text: string): string {
    let nOpenBracket = 0;
    let nClosedBracket = 0;
    let i = 0;
    let positionFirstBracket = 0;
    let positionLastBracket = 0;
    while (i < text.length) {
      if (text[i] == "{") {
        nOpenBracket++;
        if (nOpenBracket == 1) {
          positionFirstBracket = i;
        }
      } else if (text[i] == "}") {
        nClosedBracket++;
        if (nClosedBracket == nOpenBracket) {
          positionLastBracket = i;
          let deletionText = text.slice(positionFirstBracket, positionLastBracket + 1);
          text = text.replace(deletionText, " ");
          // FIXME: log properly
          // console.log(deletionText);
          nOpenBracket = 0;
          nClosedBracket = 0;
          positionLastBracket = 0;
          positionLastBracket = 0;
        }
      }
      i++;
    }
    // FIXME: log properly
    // console.log(nOpenBracket)
    return text
  }

  // This method append all selectors in one string to pass to the query selector
  public getAllSelectors(): string {
    let i = 0;
    let allSelectors = "";
    while (i < this.querySelectors.length - 1) {
      allSelectors += this.querySelectors[i] + ",";
      i++;
    }

    allSelectors += this.querySelectors[this.querySelectors.length - 1]

    return allSelectors
  }

  public parse(url: string): Promise<PageResult> {
    return JSDOM.fromURL(url).then(dom => {
      // look for a list of preferred query selectors
      var textContent = ""
      let content, nodes, nodesToRemove, i = 0
      //nodesToRemove = dom.window.document.querySelectorAll('a')
      // for (i = 0; i < nodesToRemove.length; i++) {
      //   console.log(nodesToRemove[i].textContent)
      //   nodesToRemove[i].textContent = "";
      // }
      //i = 0;
      nodes = dom.window.document.querySelectorAll(this.getAllSelectors())
      // while (i < this.querySelectors.length) 
      // if no nodes are found choose the body}
      if (!nodes.length) {
        content = dom.window.document.body
        textContent = content.textContent;
      }
      // if more nodes are found, pick the one with longest HTML inside
      else {
        nodes.forEach(function (item) {
          let nodeText = item.textContent.replace(/\s+/g, ' ').trim()
          if (nodeText.length > 40) {
            textContent += nodeText
          }
        });
      }


      return new PageResult({
        url: url,
        title: dom.window.document.title,
        sections: [
          {
            title: "main",
            content: this.removeCodeInText(textContent),
            tags: [] //FIXME: populate with some logic if possible
          }
        ],
        keywords: [], // keywords are populated from caller which knows the query object
        tags: [] //FIXME: populate with some logic (eg metadata keyword tag in html header)
      })

    })
  }

  // public parse(url: string): Promise<PageResult> {
  //   return JSDOM.fromURL(url).then(dom => {
  //     // look for a list of preferred query selectors
  //     let content, nodes, i = 0
  //     do nodes = dom.window.document.querySelectorAll(this.querySelectors[i++])
  //     while (!nodes.length && i < this.querySelectors.length)
  //     // if no nodes are found choose the body
  //     if (!nodes.length) content = dom.window.document.body
  //     // if is found exactly one node, choose that one
  //     else if (nodes.length == 1) content = nodes[0]
  //     // if more nodes are found, pick the one with longest HTML inside
  //     else content = [...nodes].reduce((a, b) => a.innerHTML.length > b.innerHTML.length ? a : b)
  //     // remove all the redundant spaces
  //     const textContent = content.textContent.replace(/\s+/g, ' ').trim()

  //     return {
  //       url: url,
  //       title: dom.window.document.title,
  //       sections: [
  //         {
  //           title: "main",
  //           content: textContent
  //         }
  //       ],
  //       keywords: []
  //     }

  //   })
  // }

}

// FIXME: move tests in tests/parsers.spec.ts
/*
const urls = [
  "https://www.studenti.it/la-gioconda-leonardo-da-vinci.html",
  "http://www.ansa.it/canale_saluteebenessere/notizie/stili_di_vita/2019/01/09/leffetto-monna-lisa-esiste-ma-non-nella-gioconda_e1b96e6e-cf5b-42c1-a53d-b688e7ffb846.html",
  "https://www.focus.it/cultura/storia/gioconda-monna-lisa-furto",
  "https://www.artribune.com/arti-visive/arte-moderna/2019/07/ristrutturazione-sala-ospita-gioconda-tela-spostata/"
]
new Parser().parse(urls[0]).then(console.log)
*/