import express from 'express'
import bodyParser from 'body-parser'
import packageJson from '../package.json'

import { ClassificationResult } from './models/classification.models'
import { GoogleSearch, GoogleSearchRouter } from './google-search'
import { buildQuery } from './build-query'
import parse from './scraping/scraping'
import { AdaptationEndpoint } from "./environment"
import { post } from "./utils"
import { WikiSearchRouter } from './wiki'
import { PageResult } from './models';

/** Express application instance */
const app: express.Application = express()

/** Google Search service */
const googleSearch = new GoogleSearch()


// Encode json bodies in requests
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.error("-----------------ERR-----------------")
    console.error(err.message, err.stack)
    console.error("----------------END-ERR---------------")
    return res.json({ message: err.message, stack: err.stack })
  }
  next()
})

// TODO: remove if still not used
app.use('/google-search', GoogleSearchRouter)
app.use('/wiki-search', WikiSearchRouter)

// Index entry-point 
app.get("/", (req, res) => res.json({ message: `App version ${packageJson.version}.` }))

// Main entry-point
app.post('/', async (req, res) => {

  try {

    /** Parsed Classification result */
    const classificationResult = req.body as ClassificationResult
    if (!classificationResult) {
      return res.json({
        message: "Missing required body."
      })
    }

    // Builds the query using the classification result and the query expansion provided by the classification group
    const queries = await buildQuery(classificationResult)

    /** Result array */
    const results: Array<PageResult> = []

    await Promise.all(
      // for each query
      queries.map(async q => {
        // query Google Search and get the list of results
        return googleSearch.queryCustom(q.originalQuery + " " + q.expandedKeywords.join(" ")).then(async queryResult => {
          return Promise.all(
            // for each result
            queryResult.items.map(item => {
              // Scrape text from results
              return parse(item.link).then(parsedContent => {
                parsedContent.keywords = q.expandedKeywords
                results.push(parsedContent)
              })
            })
          )
        })
      })
    )

    // Call adaptation for summary
    return post(AdaptationEndpoint + "/tailored_text", {
      userProfile: classificationResult.userProfile,
      results: results
    }).then(r => res.json(r)) // respond with the obtained object

    // Catch any error and inform the caller
  } catch (ex) {
    return res.json({ message: ex.message })
  }

})

export default app
