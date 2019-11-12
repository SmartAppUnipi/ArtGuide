import { JSDOM } from "jsdom"
import { PageResult } from '../models'


// TODO: remove
const urls = [
  "https://www.studenti.it/la-gioconda-leonardo-da-vinci.html",
  "http://www.ansa.it/canale_saluteebenessere/notizie/stili_di_vita/2019/01/09/leffetto-monna-lisa-esiste-ma-non-nella-gioconda_e1b96e6e-cf5b-42c1-a53d-b688e7ffb846.html",
  "https://www.focus.it/cultura/storia/gioconda-monna-lisa-furto",
  "https://www.monnalisa.eu/it/"
]


export class Parser {

  private querySelectors = [
    "#content",
    ".content",
    "#container",
    ".container",
    "[id*='container']",
    "[class*='container']"
  ]

  public async parse(url: string): Promise<PageResult> {
    return JSDOM.fromURL(url).then(dom => {
      // look for a list of preferred query selectors
      let content, nodes, i = 0
      do nodes = dom.window.document.querySelectorAll(this.querySelectors[i++])
      while (!nodes.length && i < this.querySelectors.length)
      // if no nodes are found choose the body
      if (!nodes.length) content = dom.window.document.body
      // if is found exactly one node, choose that one
      else if (nodes.length == 1) content = nodes[0]
      // if more nodes are found, pick the one with longest HTML inside
      else content = [...nodes].reduce((a, b) => a.innerHTML.length > b.innerHTML.length ? a : b)
      // remove all the redundant spaces
      const textContent = content.textContent.replace(/\s+/g, ' ').trim()

      return {
        url: url,
        title: dom.window.document.title,
        sections: [
          {
            title: "main",
            content: textContent
          }
        ],
        keywords: []
      }

    })
  }

}
