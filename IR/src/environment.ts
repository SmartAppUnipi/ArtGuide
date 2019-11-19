import dotenv from "dotenv";

// Load env variables from .env file in the IR folder
const result = dotenv.config();

if (result.error)
    throw result.error;


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
}

/** The logger configuration */
const LoggerConfig = {
    /** The minimum log level to log */
    level: process.env.LoggerLevel,
    /** The log file where to write. If absent nothing is written on disk. */
    file: process.env.LogFile,
    /** If true the logs on console are written. If a file is
     * not specified, this cannot be disabled.
     */
    enableLogsOnConsole: process.env.EnableLogsOnConsole
};

// ENDPOINTS
/** The url of the Adaptation module endpoint */
const AdaptationEndpoint = process.env.AdaptationEndpoint;

export {
    AdaptationEndpoint,
    GoogleSearchConfig,
    LoggerConfig
};
