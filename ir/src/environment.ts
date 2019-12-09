import * as routesJson from "../../routes.json";
import dotenv from "dotenv";

// Load env variables from .env file in the IR folder
if (!process.env.CI) {
    const result = dotenv.config();

    /* istanbul ignore else: cannot be tested without a .env file */
    if (result.error) {
        console.error(`
        Cannot load environment variables from .env file. Using defaults. \n
        The Google Search requests are served from cache (google-cache.json) if available, otherwise
        they will throw an error since the APIs key is missing.
        ${result.error}
    `);
    }
}


/** The Google Search APIs configuration */
const GoogleSearchConfig = {
    /** The Google Custom Search APIs Key */
    apiKey: process.env.GoogleCustomSearchAPIKey_00,
    /** The Google Custom Search Engine Id */
    searchEngineId: {
        /** The Google Custom Search Engine Id (Italian version) */
        it: process.env.GoogleCustomSearchEngineId_IT_00,
        /** The Google Custom Search Engine Id (English version) */
        en: process.env.GoogleCustomSearchEngineId_EN_00,
        /** The Google Custom Search Engines for kids */
        kids: {
            /** The Google Custom Search Engine Id for kids (English version) */
            en: process.env.GoogleCustomSearchEngineId_EN_KIDS,
            /** The Google Custom Search Engine Id for kids (Italian version) */
            it: process.env.GoogleCustomSearchEngineId_IT_KIDS,
        }
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
    disableLogsOnConsole: process.env.DisableLogsOnConsole
};

/** The port on which express in listening at */
const ExpressPort = new URL(routesJson.opus).port;

// ENDPOINTS
/** The url of the Adaptation module endpoint */
const AdaptationEndpoint = {
    text: routesJson.text,
    keywords: routesJson.keywords
};

export {
    AdaptationEndpoint,
    GoogleSearchConfig,
    LoggerConfig,
    ExpressPort
};
