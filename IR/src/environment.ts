import dotenv from "dotenv";
import * as routesJson from '../../routes.json';

// Load env variables from .env file in the IR folder
const result = dotenv.config();

if (result.error)
    console.error(`
        Cannot load environment variables from .env file. Using defaults. \n
        The Google Search requests are served from cache if available, otherwise
        they will throw an error since the APIs key is missing.
    `)


/** The Google Search APIs configuration */
const GoogleSearchConfig = {
    /** The Google Custom Search APIs Key */
    apiKey: process.env.GoogleCustomSearchAPIKey_00,
    /** The Google Custom Search Engine Id */
    searchEngineId: {
        /** The Google Custom Search Engine Id (Italian version) */
        it: process.env.GoogleCustomSearchEngineId_IT_00,
        /** The Google Custom Search Engine Id (English version) */
        en: process.env.GoogleCustomSearchEngineId_EN_00
    }
};

/** The logger configuration */
const LoggerConfig = {
    /** The minimum log level to log */
    level: process.env.LoggerLevel || "error",
    /** The log file where to write. If absent nothing is written on disk. */
    file: process.env.LogFile,
    /**
     * If true the logs on console are written. If a file is
     * not specified, this cannot be disabled.
     */
    enableLogsOnConsole: process.env.EnableLogsOnConsole
};

/** The port on which express in listening at */
const opusUrl = new URL(routesJson.opus);
const ExpressPort = opusUrl.port || 3000;

// ENDPOINTS
/** The url of the Adaptation module endpoint */
const AdaptationEndpoint = {
    text: routesJson.text,
    keywords: routesJson.keywords
}

export {
    AdaptationEndpoint,
    GoogleSearchConfig,
    LoggerConfig,
    ExpressPort
};
