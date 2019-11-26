/// <reference types="@types/jest"/>

import { Parser } from "../src/parser"

const urls = [
    "https://www.arteworld.it/notte-stellata-van-gogh-analisi/",
    "https://www.theartpostblog.com/notte-stellata-van-gogh/",
    "https://it.wikipedia.org/wiki/Notte_stellata",
    "https://www.studenti.it/la-gioconda-leonardo-da-vinci.html",
    "http://www.ansa.it/canale_saluteebenessere/notizie/stili_di_vita/2019/01/09/leffetto-monna-lisa-esiste-ma-non-nella-gioconda_e1b96e6e-cf5b-42c1-a53d-b688e7ffb846.html",
    "https://www.focus.it/cultura/storia/gioconda-monna-lisa-furto",
    "https://www.artribune.com/arti-visive/arte-moderna/2019/07/ristrutturazione-sala-ospita-gioconda-tela-spostata/",
    "http://www.csszengarden.com/?cssfile=/219/219.css",
    "http://www.csszengarden.com/216/"
  ]


describe("Index module", () => {

    it("Should return text", async () => {
        await new Parser().parse(urls[0]).then(console.log)
    })
    
})
