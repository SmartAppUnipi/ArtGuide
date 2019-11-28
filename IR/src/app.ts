import { AdaptationEndpoint } from "./environment";
import bodyParser from "body-parser";
import { ClassificationResult } from "src/models";
import express from "express";
import logger from "./logger";
import packageJson from "../package.json";
import path from "path";
import { post, reduceEntities } from "./utils";
import { Search } from "./search";
import { WikiData, Wikipedia } from "./wiki";

/** Config for smart search */
const config = {
    entityFilter: {
        maxEntityNumber: 5,
        minScore: 0.5,
    },
    weight: {
        wikipedia: {
            known: 1,
            unknown: 0.6
        },
        google: {
            known: 0.75,
            unknown: 0.9
        }
    }
}

/** Search module */
const search = new Search();

/** Wikipedia module */
const wikipedia = new Wikipedia();

/** WikiData module */
const wikidata = new WikiData();

/** Express application instance */
const app: express.Application = express();
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

        // Parse the classification result json
        const classificationResult = req.body as ClassificationResult;
        if (!classificationResult) {
            const err = new Error("Missing required body.")
            console.log(err)
            return res.json({ message: err.message });
        }


        /* MAIN FLOW

           We receive the Google vision results from the classification module.
           
            1. sort results.entities and result.labels by score descending
            2. slice results.entities and results.labels reducing the number of results
                - at the first "big" gap between scores
                - using a max-length to be sure to crop it sooner or later
                - using a min-score to ensure a quality threshold?

            3. check if there is a known entity among the remaining ones
                - take the corresponding WikiData entry
                - look for the presence of one of these fields:
                    - geo location
                    - author
                    - architect
                    - creator
            
            BRANCH A: known entity
                5a. search by entityId on Wikipedia
                    - weight on the score: 1
                    - look also for
                        - creator/architect
                        - period
                        - style
                        - movement
                5b. search for the exact query on Google
                    - weight on the score: 0.8
                    - use query expansion

            BRANCH B: not a known entity
                4. remove unwanted entity (not art)
                    - for each entity take the corresponding WikiData entry
                        - recursively populate the array instanceOf up to n=3 levels
                        - perform a bottom up breadth first visit of the "instance of" graph
                            - discarding the entity if a after real-clock expires
                            - keep the entity if it's instance of one of the following piece of arts
                                - painting
                                - building
                                - sculpture
                                - tower
                                - facade
                                - ...
                
                5a. search for the top score entities on Wikipedia
                    - weight on the score: 0.6
                5b. build a smart query on Google
                    - weight on the score: 0.9
                    - use query expansion
                    - merge multiple entities?
        */

        // 1. sort results.entities and result.labels by score descending
        classificationResult.classification.entities.sort((e1, e2) => e1.score - e2.score);
        classificationResult.classification.labels.sort((l1, l2) => l1.score - l2.score);

        // 2. slice results.entities and results.labels reducing the number of results
        classificationResult.classification.entities = reduceEntities(classificationResult.classification.entities,
            config.entityFilter.maxEntityNumber, config.entityFilter.minScore)
        classificationResult.classification.labels = reduceEntities(classificationResult.classification.labels,
            config.entityFilter.maxEntityNumber, config.entityFilter.minScore)

        //3. check if there is a known entity
        const knownInstance = await wikidata.getKnownInstance(classificationResult)

        let results;
        if (knownInstance) {
            // BRANCH A: known entity
            //  5a. search by entityId on Wikipedia
            //  5b. search for the exact query on Google
            logger.debug("[app.ts] Got a known instance.");
            results = await Promise.all([
                wikipedia.searchKnownInstance(knownInstance, classificationResult.userProfile.language)
                    .then(results => results.forEach(
                        result => result.score *= config.weight.wikipedia.known)),
                // TODO: Google search for a specific query (bypass build basic query)
                search.search(classificationResult)
                    .then(results => results.forEach(
                        result => result.score *= config.weight.google.known)),
            ]).then(allResults => [].concat(...allResults));
            logger.debug("[app.ts] Google and Wikipedia requests ended.");
        } else {
            // BRANCH B: not a known entity
            // TODO: 4. remove unwanted entity (not art)

            //  5a. search for the top score entities on Wikipedia
            //  5b. build a smart query on Google
            logger.debug("[app.ts] Not a known instance.");
            results = await Promise.all([
                wikipedia.search(classificationResult)
                    .then(results => results.forEach(
                        result => result.score *= config.weight.wikipedia.unknown)),
                search.search(classificationResult)
                    .then(results => results.forEach(
                        result => result.score *= config.weight.google.unknown)),
            ]).then(allResults => [].concat(...allResults));
            logger.debug("[app.ts] Google and Wikipedia requests ended.");
        }

        /*
        END OF MAIN FLOW
        */


        // call adaptation for summary and return the result to the caller
        return post(AdaptationEndpoint.text, {
            userProfile: classificationResult.userProfile,
            results
        }).then(adaptationResponse => {
            logger.debug("[app.ts] Adaptation Response received.");
            res.send(adaptationResponse);
        });

    // Catch any error and inform the caller
    } catch (ex) {
        logger.error("[app.ts]", ex);
        return res.json({ message: ex.message, stack: ex.stack });
    }

});

export default app;
