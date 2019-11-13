import express from 'express'
import bodyParser from 'body-parser'
import packageJson from '../package.json'
import path from 'path'
import { ClassificationResult } from "src/models"
import { AdaptationEndpoint } from "./environment"
import { logger } from './logger'
import { post } from "./utils"
import { Search } from "./search"
import { Wiki } from "./wiki"
import { WikiData } from './wikidata'

/** Express application instance */
const app: express.Application = express()

/** Search module */
const search = new Search()

/** WikiPedia module */
const wiki = new Wiki()

// TODO: use it. And integrate the result in the output for the classification module.
/** WikiData module */
const wikidata = new WikiData()

// Encode json bodies in requests
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    logger.error(`[app.ts] Unhandled error`, err)
    return res.json({ message: err.message, stack: err.stack })
  }
  next()
})

// Index entry-point 
app.get("/", (req, res) => res.json({ message: `App version ${packageJson.version}.` }))

// Docs entry-point
app.use("/docs", express.static(path.join(__dirname, '../docs')))



// Main entry-point
app.post('/', async (req, res) => {

  try {
    logger.debug(`[app.ts] Post request received.`)

    /** Parsed Classification result */
    const classificationResult = req.body as ClassificationResult
    if (!classificationResult) {
      return res.json({
        message: "Missing required body."
      })
    }

    /** WikiData metadata */
    const wikidataResponse = await wikidata.search(classificationResult)
    logger.debug(`[app.ts] WikiData request ended.`)
    logger.silly(`[app.ts] WikiData response: `, wikidataResponse)

    /** Page Result array */
    const results = await Promise.all([
      search.search(classificationResult),
      wiki.search(classificationResult)
    ]).then(allResults => [].concat(...allResults))
    logger.debug(`[app.ts] Google and Wikipedia requests ended.`)

    // Call adaptation for summary
    return post(AdaptationEndpoint + "/tailored_text", {
      userProfile: classificationResult.userProfile,
      results: results
    }).then(adaptationResponse => {
      logger.debug(`[app.ts] Adaptation Response received.`)
      logger.silly(`[app.ts] Adaptation Response: `, adaptationResponse)
      // add wikidata metadata for the Classification module
      adaptationResponse.wikidata = wikidataResponse
      res.send(adaptationResponse)
    })

    // Catch any error and inform the caller
  } catch (ex) {
    logger.error('[app.ts]', ex)
    return res.json({ message: ex.message, stack: ex.stack })
  }

})

export default app
