import * as childProcess from "child_process";
import * as config from "../config.json";
import { Adaptation } from "./adaptation";
import { appendValidation as augmentWithValidation } from "./validation-service";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import fs from "fs";
import logger from "./logger";
import { LoggerConfig } from "./environment";
import packageJson from "../package.json";
import path from "path";
import { Search, CacheService } from "./search";
import { ClassificationResult, Entity, ExpertizeLevelType, LogLevels, PageResult, TailoredTextResponse } from "./models";
import { reduceEntities, generateId } from "./utils";
import { WikiData, Wikipedia } from "./wiki";
/**
 * Return the last commit hash on the local repository
 * 
 * @returns The hash of the last commit on the local machine.
 */
export function getLastCommitHash(): string {
    const latestCommit = childProcess
        .execSync("git rev-parse HEAD")
        .toString()
        .replace(/\n/, "");

    return latestCommit;
}


/** Express application instance */
const app: express.Application = express();
// Encode json bodies in requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

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
    const latestCommit = getLastCommitHash();
    return res.json({
        message: `IR module version ${packageJson.version}.`,
        currentCommit: `https://github.com/SmartAppUnipi/ArtGuide/commit/${latestCommit}`,
        currentTree: `https://github.com/SmartAppUnipi/ArtGuide/tree/${latestCommit}`,
        rawLogs: "/logs/raw?minLogLevel=error&contains=text"
    });
});

app.use("/docs", express.static(path.join(__dirname, "../docs")));
app.use("/coverage", express.static(path.join(__dirname, "../coverage/lcov-report/")));
app.use("/ui", express.static(path.join(__dirname, "../client/ui")));

// Serve trace log
if (LoggerConfig.file) {
    app.use("/logs", express.static(path.join(__dirname, "../client/logs")));
    app.get("/logs/raw", (req, res) => {

        const file = path.join(__dirname, `../${LoggerConfig.file}`);

        const minLogLevel = req.query.minLogLevel;
        const contains = req.query.contains;

        if (!minLogLevel && !contains) {
            express.static.mime.define({ "application/json": ["json", "log"] });
            return res.sendFile(file);
        }

        try {
            let logs = JSON.parse(fs.readFileSync(file).toString());
            if (contains)
                logs = logs.filter(log => JSON.stringify(log).includes(contains));

            if (minLogLevel) {
                logs = logs.filter(log => {
                    const currentLogLevel = LogLevels[log.level];
                    return currentLogLevel <= LogLevels[minLogLevel];
                });
            }

            return res.json(logs);

        } catch (ex) {
            const error = ex as Error;
            return res.status(500).json({
                message: "Error parsing the logs",
                error: {
                    message: error.message,
                    stack: error.stack
                }
            });
        }
    });
}

// Main entry-point
app.post("/", async (req, res) => {

    const search = new Search();
    const wikipedia = new Wikipedia();
    const wikidata = new WikiData();
    const adaptation = new Adaptation();

    try {

        // Parse the classification result json
        const classificationResult = req.body as ClassificationResult;

        logger.debug("[app.ts] Post request received.", { from: req.ip, hostname: req.hostname, classificationResult });

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

            logger.debug("[app.ts] Reduced classification entities and labels.", {
                entities: metaEntities.map(m =>
                    ({ description: m.description, score: m.score, entityId: m.entityId } as Entity))
            });

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
            logger.debug("[app.ts] Not a known instance.",
                { reducedClassificationEntities: classificationResult.classification.entities });

            // 6. remove unwanted entity (not art)
            const filteredEntities = await wikidata.filterNotArtRelatedResult(metaEntities);

            logger.debug("[app.ts] Reduced classification entities and labels.", {
                entities: filteredEntities.map(m =>
                    ({ description: m.description, score: m.score, entityId: m.entityId } as Entity))
            });

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
            .then(response => {
                return { ...response, knownInstance } as TailoredTextResponse
            })
            .then(response => augmentWithValidation(response))
            .then(response => {
                const dbService = new CacheService("ir-requests-db.json");
                dbService.set(response.requestId, response);

                return response;
            })
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

app.post("/validation", async (req, res) => {
    const { requestId, sentenceId, validation } = req.body;
    const dbValidationService = new CacheService("ir-validation-db.json");
    dbValidationService.set(generateId(16), {
        date: new Date(),
        sentenceId,
        requestId,
        validation
    });

    return res.status(204).send();
});

interface Validation {
    date: Date;
    sentenceId: string;
    requestId: string,
    validation: number
}

app.get("/validation", async (req, res) => {

    const dbService = new CacheService("ir-requests-db.json");
    const dbValidationService = new CacheService("ir-validation-db.json");

    const userTastesValidation = new Map<string, number>();
    const urlsValidation = new Map<string, number>();

    for (const validationRecord of dbValidationService.getAll<Validation>()) {
        const response = dbService.get<TailoredTextResponse>(validationRecord.requestId);

        response?.userProfile.tastes.forEach(t => {
            const oldScore = userTastesValidation.get(t) ?? 0;
            const newScore = oldScore + validationRecord.validation;
            userTastesValidation.set(t, newScore);
        });

        const validation = response?.validation.find(val => val.sentenceId == validationRecord.sentenceId);
        if (validation) {
            const url = validation.matchingPageResult.url;
            const oldScore = urlsValidation.get(url) ?? 0;
            const newScore = oldScore + validationRecord.validation;
            urlsValidation.set(url, newScore);
        }
    }

    const mapToObj = (m: Map<string, number>) => {
        return Array.from(m).reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
        }, {});
    };

    return res.json({
        urlsValidation: mapToObj(urlsValidation),
        userTastesValidation: mapToObj(userTastesValidation)
    });

    

});

export default app;