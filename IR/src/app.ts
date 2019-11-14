import { AdaptationEndpoint } from "./environment";
import bodyParser from "body-parser";
import { ClassificationResult } from "src/models";
import express from "express";
import logger from "./logger";
import packageJson from "../package.json";
import path from "path";
import { post } from "./utils";
import { Search } from "./search";
import { Wiki } from "./wiki";
import { WikiData } from "./wikidata";

/** Express application instance */
const app: express.Application = express();

/** Search module */
const search = new Search();

/** WikiPedia module */
const wiki = new Wiki();

/** WikiData module */
const wikidata = new WikiData();

// Encode json bodies in requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    logger.error("[app.ts] Unhandled error", err);
    return res.json({ message: err.message, stack: err.stack });
  }
  next();
});

// Index entry-point
app.get("/", (req, res) => res.json({ message: `App version ${packageJson.version}.` }));

// Docs entry-point
app.use("/docs", express.static(path.join(__dirname, "../docs")));

// Main entry-point
app.post("/", async (req, res) => {

  try {
    logger.debug("[app.ts] Post request received.");

    /** Parsed Classification result */
    const classificationResult = req.body as ClassificationResult;
    if (!classificationResult) {
      return res.json({
        message: "Missing required body."
      });
    }

    // sort entities and labels in classification result by score
    classificationResult.classification.entities.sort((e1, e2) => e1.score - e2.score)
    classificationResult.classification.labels.sort((l1, l2) => l1.score - l2.score)

    /** WikiData metadata */
    const wikidataResponse = await wikidata.search(classificationResult);
    logger.debug("[app.ts] WikiData request ended.");

    /** Page Result array */
    const results = await Promise.all([
      search.search(classificationResult),
      wiki.search(classificationResult)
    ]).then((allResults) => [].concat(...allResults));
    logger.debug("[app.ts] Google and Wikipedia requests ended.");

    // Call adaptation for summary
    return post(AdaptationEndpoint + "/tailored_text", {
      userProfile: classificationResult.userProfile,
      results
    }).then((adaptationResponse) => {
      logger.debug("[app.ts] Adaptation Response received.");
      // add wikidata metadata for the Classification module
      adaptationResponse.wikidata = wikidataResponse;
      res.send(adaptationResponse);
    });

    // Catch any error and inform the caller
  } catch (ex) {
    logger.error("[app.ts]", ex);
    return res.json({ message: ex.message, stack: ex.stack });
  }

})

export default app;
