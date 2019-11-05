import express from 'express';
import { ClassificationResult } from './models/classification.models';
import bodyParser from 'body-parser';
import { GoogleSearch, GoogleSearchRouter } from './google-search';
import { buildQuery } from './build-query';
import { parse } from './scraping/scraping'
import { AdaptationEndpoint } from "./environment"
import { post } from "./utils"

// Create a new express application instance
const app: express.Application = express();
// Encode json bodies in requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if(err){
    console.log("-----------------ERR-----------------")
    console.log(err.message, err.stack)
    console.log("-----------------END-ERR-----------------")
    return res.json({ message: err.message, stack: err.stack });
  }
  next()
})



// Initialize Google Search service
const googleSearch = new GoogleSearch();

app.use("/google-search", GoogleSearchRouter);

// Index entry-point 
app.get("/", (req, res) => res.json({ message: 'App running!' }))

// Classification result
app.post('/', async (req, res) => {

  try {

    const classificationResult = req.body as ClassificationResult;

    if (!classificationResult) {
      return res.json({
        message: "Missing required body"
      })
    }
    // Builds the query using the classification result and the query expansion provided by the classification group
    const queries = await buildQuery(classificationResult)

    const results: any = [];

    // TODO: better parallelize the code
    await Promise.all(
      queries.map(async q => {
        // Make a separate query search
        // Query Google Search
        const queryResult = await googleSearch.queryCustom(q.originalQuery + " " + q.expandedKeywords.join(" "));
        // Scrape text from results
        await Promise.all(
          queryResult.items.map(item => {
            parse(item.link).then((parsedContent: any) => {
              parsedContent.keywords = q.expandedKeywords;
              results.push(parsedContent);
            });
          })
        );
      })
    );


    // Call adaptation for summary
    return post<any>(AdaptationEndpoint + "/tailored_text", {
      "userProfile": classificationResult.userProfile,
      "results": results
    }).then(r => res.json(r))


  } catch (ex) {
    return res.json({ message: ex.message });
  }
});

export default app;

