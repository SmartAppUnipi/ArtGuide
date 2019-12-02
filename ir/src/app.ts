import * as config from "../config.json";
import { AdaptationEndpoint } from "./environment";
import bodyParser from "body-parser";
import express from "express";
import logger from "./logger";
import packageJson from "../package.json";
import path from "path";
import { Search } from "./search";
import { ClassificationResult, PageResult, Query, TailoredTextRequest, TailoredTextResponse } from "./models";
import { post, reduceEntities } from "./utils";
import { WikiData, Wikipedia } from "./wiki";

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
        logger.error("[app.ts] Unhandled error", { exception: err });
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

        logger.debug("[app.ts] Post request received.", { from: req.ip, hostname: req.hostname });

        // Parse the classification result json
        const classificationResult = req.body as ClassificationResult;
        if (!classificationResult) {
            res.status(400);
            return res.json({ error: "Missing required body." });
        }

        // Ensure the language is supported
        if (!config.supportedLanguages.includes(classificationResult.userProfile.language)) {
            res.status(400);
            return res.json({ error: `Unsupported language ${classificationResult.userProfile.language}.` });
        }



        /*
         * MAIN FLOW
         * 
         * We receive the Google vision results from the classification module.
         * 
         *  1. sort results.entities and result.labels by score descending
         *  2. slice results.entities and results.labels reducing the number of results
         *      - at the first "big" gap between scores
         *      - using a max-length to be sure to crop it sooner or later
         *      - using a min-score to ensure a quality threshold?
         * 
         *  3. check if there is a known entity among the remaining ones
         *      - take the corresponding WikiData entry
         *      - look for the presence of one of these fields:
         *          - geo location
         *          - author
         *          - architect
         *          - creator
         *  
         *  BRANCH A: known entity
         *      5a. search by entityId on Wikipedia
         *          - weight on the score: 1
         *          - look also for
         *              - creator/architect
         *              - period
         *              - style
         *              - movement
         *      5b. search for the exact query on Google
         *          - weight on the score: 0.8
         *          - use query expansion
         * 
         *  BRANCH B: not a known entity
         *      4. remove unwanted entity (not art)
         *          - for each entity take the corresponding WikiData entry
         *              - recursively populate the array instanceOf/subClassOf 
         *              - perform a bottom up breadth first visit of the "instance of / subClassOf" graph
         *                  - discarding the entity if a after real-clock expires (resolved using a single SparQL query)
         *                  - keep the entity if it's instance of one of the following piece of arts
         *                      - painting
         *                      - building
         *                      - sculpture
         *                      - tower
         *                      - facade
         *                      - ...
         *      
         *      5a. search for the top score entities on Wikipedia
         *          - weight on the score: 0.6
         *      5b. build a smart query on Google
         *          - weight on the score: 0.9
         *          - use query expansion
         *          - merge multiple entities?
         */

        logger.debug("[app.ts] Original classification entities and labels.", {
            classificationEntities: classificationResult.classification.entities,
            classificationLabels: classificationResult.classification.labels
        });

        // 1. sort results.entities and result.labels by score descending
        classificationResult.classification.entities.sort((e1, e2) => e2.score - e1.score);
        classificationResult.classification.labels.sort((l1, l2) => l2.score - l1.score);

        // 2. slice results.entities and results.labels reducing the number of results
        classificationResult.classification.entities = reduceEntities(
            classificationResult.classification.entities,
            config.flowConfig.entityFilter.maxEntityNumber,
            config.flowConfig.entityFilter.minScore
        );
        classificationResult.classification.labels = reduceEntities(
            classificationResult.classification.labels,
            config.flowConfig.entityFilter.maxEntityNumber,
            config.flowConfig.entityFilter.minScore
        );

        logger.debug("[app.ts] Reduced classification entities and labels.", {
            classificationEntities: classificationResult.classification.entities,
            classificationLabels: classificationResult.classification.labels
        });

        // 3. check if there is a known entity
        const knownInstance = await wikidata.tryGetKnownInstance(classificationResult);

        let results: Array<PageResult>;
        if (knownInstance) {
            /*
             * BRANCH A: known entity
             *  5a. search by entityId on Wikipedia
             *  5b. search for the exact query on Google
             */
            logger.debug("[app.ts] Got a known instance.", { knownInstance });
            results = await Promise.all([
                wikipedia
                    .searchKnownInstance(knownInstance, classificationResult.userProfile.language)
                    .then(pageResults => {
                        pageResults.forEach(pageResult =>
                            pageResult.score *= config.flowConfig.weight.wikipedia.known);
                        return pageResults;
                    }),
                search
                    .searchByTerms(new Query({
                        language: classificationResult.userProfile.language,
                        searchTerms: knownInstance.WikipediaPageTitle,
                        keywords: []
                    }))
                    .then(pageResults => {
                        pageResults.forEach(pageResult =>
                            pageResult.score *= config.flowConfig.weight.google.known);
                        return pageResults;
                    })
            ]).then(allResults => [].concat(...allResults));
            logger.debug("[app.ts] Google and Wikipedia requests ended.");
        } else {
            /*
             * BRANCH B: not a known entity
             * TODO: 4. remove unwanted entity (not art)
             */

            /*
             *  5a. search for the top score entities on Wikipedia
             *  5b. build a smart query on Google
             */
            logger.debug("[app.ts] Not a known instance.",
                         { reducedClassificationEntities: classificationResult.classification.entities });
            results = await Promise.all([
                wikipedia.search(classificationResult)
                    .then(results => {
                        results.forEach(result =>
                            result.score *= config.flowConfig.weight.wikipedia.unknown);

                        return results;
                    }),
                search.search(classificationResult)
                    .then(results => {
                        results.forEach(result =>
                            result.score *= config.flowConfig.weight.google.unknown);

                        return results;
                    })
            ]).then(allResults => [].concat(...allResults));
            logger.debug("[app.ts] Google and Wikipedia requests ended.");
        }

        // 6. Sort the results by score
        results.sort((p1, p2) => p2.score - p1.score);

        /*
         *END OF MAIN FLOW
         */


        // call adaptation for summary and return the result to the caller
        logger.debug("[app.ts] Call to adaptation text.", {
            adaptationUrl: AdaptationEndpoint.text,
            resultsSent: results
        });
        return post<TailoredTextResponse>(AdaptationEndpoint.text, {
            userProfile: classificationResult.userProfile,
            results
        } as TailoredTextRequest).then(adaptationResponse => {
            logger.debug("[app.ts] Adaptation Response received.", { adaptationResponse });
            res.send(adaptationResponse);
        });

        // Catch any error and inform the caller
    } catch (ex) {
        logger.error("[app.ts]", ex);
        return res.json({ message: ex.message, stack: ex.stack });
    }

});

export default app;