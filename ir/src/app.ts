import * as childProcess from "child_process";
import * as config from "../config.json";
import { Adaptation } from "./adaptation";
import bodyParser from "body-parser";
import express from "express";
import logger from "./logger";
import { LoggerConfig } from "./environment";
import packageJson from "../package.json";
import path from "path";
import { reduceEntities } from "./utils";
import { Search } from "./search";
import { ClassificationResult, Entity, ExpertizeLevelType, PageResult } from "./models";
import { WikiData, Wikipedia } from "./wiki";


/** Express application instance */
const app: express.Application = express();
// Encode json bodies in requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
        logger.error("[app.ts] Unhandled error", { exception: err });
        /* istanbul ignore next */
        return res.status(500).json({ message: err.message, stack: err.stack });
    }
    next();
});

// Index entry-point
app.get("/", (req, res) => {

    const latestCommit = childProcess
        .execSync("git rev-parse HEAD")
        .toString()
        .replace(/\n/, "");

    return res.json({
        message: `IR module version ${packageJson.version}.`,
        currentCommit: `https://github.com/SmartAppUnipi/ArtGuide/commit/${latestCommit}`,
        currentTree: `https://github.com/SmartAppUnipi/ArtGuide/tree/${latestCommit}`
    });
});

app.use("/docs", express.static(path.join(__dirname, "../docs")));
app.use("/coverage", express.static(path.join(__dirname, "../coverage/lcov-report/")));

// Serve trace log
if (LoggerConfig.file) {
    express.static.mime.define({ "application/json": ["json", "log"] });
    const file = path.join(__dirname, `../${LoggerConfig.file}`);
    app.use("/logs", express.static(file));
}

// Main entry-point
app.post("/", async (req, res) => {

    const search = new Search();
    const wikipedia = new Wikipedia();
    const wikidata = new WikiData();
    const adaptation = new Adaptation();

    try {

        logger.debug("[app.ts] Post request received.", { from: req.ip, hostname: req.hostname });

        // Parse the classification result json
        const classificationResult = req.body as ClassificationResult;
        if (!classificationResult ||
            !classificationResult.classification ||
            !classificationResult.userProfile) {
            logger.warn({ message: "Missing required body.", classificationResult });
            return res
                .status(400)
                .json({ error: "Missing required body." });
        }


        // Ensure the language is supported
        if (!config.supportedLanguages.includes(classificationResult.userProfile.language)) {
            logger.warn({ message: "Unsupported language.", language: classificationResult.userProfile.language });
            return res
                .status(400)
                .json({ error: `Unsupported language ${classificationResult.userProfile.language}.` });
        }

        // everything 
        logger.debug("[app.ts] Original classification entities and labels.", {
            classificationEntities: classificationResult.classification?.entities ?? [],
            classificationLabels: classificationResult.classification?.labels ?? []
        });

        // 1. Aggregate all entities
        const language = classificationResult.userProfile.language;
        let entities: Array<Entity> = [].concat(
            classificationResult?.classification?.entities ?? [],
            classificationResult?.classification?.labels ?? [],
            classificationResult?.classification?.style ?? []
        );

        // require at least one entity
        if (!entities.length) {
            return res
                .status(400)
                .json({ error: "No entities found." });
        }


        // 2. sort entities by score descending
        entities.sort((e1, e2) => e2.score - e1.score);

        // 3. slice entities reducing the number of results
        entities = reduceEntities(
            entities,
            config.flowConfig.entityFilter.maxEntityNumber,
            config.flowConfig.entityFilter.minScore
        );

        logger.debug("[app.ts] Reduced classification entities and labels.", { entities });

        // 4. populate the metadata
        const metaEntities = await Promise.all(entities.map(entity => wikidata.getProperties(entity, language)));

        // 5. Try to get a known instance
        const knownInstance = await wikidata.tryGetKnownInstance(metaEntities, language);

        const searchPromises: Array<Promise<Array<PageResult>>> = [];
        if (knownInstance) {
            /*
             * BRANCH A: known entity
             * 7a. search by entityId on Wikipedia
             * 7b. search for the exact query on Google
             */
            logger.debug("[app.ts] Got a known instance.", { knownInstance });

            if (classificationResult.userProfile.expertiseLevel != ExpertizeLevelType.Child) {
                // Use Wikipedia if the user is not a child
                searchPromises.push(
                    wikipedia
                        .searchKnownInstance(knownInstance, language)
                        .then(pageResults => {
                            pageResults.forEach(pageResult =>
                                pageResult.score *= config.scoreWeight.known.wikipedia);
                            return pageResults;
                        })
                );
            }

            searchPromises.push(
                search
                    .searchKnownInstance(knownInstance, classificationResult.userProfile)
                    .then(pageResults => {
                        pageResults.forEach(pageResult =>
                            pageResult.score *= config.scoreWeight.known.google);
                        return pageResults;
                    })
            );

            logger.debug("[app.ts] Google and Wikipedia requests ended.");
        } else {
            // BRANCH B: not a known entity
            logger.debug("[app.ts] Not a known instance.", {
                reducedClassificationEntities: classificationResult.classification.entities
            });

            // 6. remove unwanted entity (not art)
            const filteredEntities = await wikidata.filterNotArtRelatedResult(metaEntities);

            /*
             *  5a. search for the top score entities on Wikipedia
             *  5b. build a smart query on Google
             */
            if (classificationResult.userProfile.expertiseLevel != ExpertizeLevelType.Child) {
                // Use Wikipedia if the user is not a child
                searchPromises.push(
                    wikipedia.search(filteredEntities, language)
                        .then(results => {
                            results.forEach(result =>
                                result.score *= config.scoreWeight.unknown.wikipedia);
                            return results;
                        })
                );
            }

            searchPromises.push(
                search.search(filteredEntities, classificationResult.userProfile)
                    .then(results => {
                        results.forEach(result =>
                            result.score *= config.scoreWeight.unknown.google);
                        return results;
                    })
            );

            logger.debug("[app.ts] Google and Wikipedia requests ended.");
        }

        const results: Array<PageResult> = await Promise
            .all(searchPromises)
            .then(allResults => [].concat(...allResults));

        // 6. Sort the results by score
        results.sort((p1, p2) => p2.score - p1.score);

        /*
         * END OF MAIN FLOW
         */


        // call adaptation for summary and return the result to the caller
        return adaptation
            .getTailoredText(results, classificationResult.userProfile)
            .then(adaptationResponse => res.send(adaptationResponse));

        // Catch any error and inform the caller
    } catch (ex) {
        logger.error("[app.ts] ", ex);
        /* istanbul ignore next */
        return res
            .status(500)
            .json({ message: ex.message, stack: ex.stack });
    }

});

export default app;