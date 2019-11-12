import dotenv from 'dotenv'


// Load env variables from .env file in the IR folder
const result = dotenv.config()

if (result.error) throw result.error

/** The Google Custom Search APIs Key */
const GoogleCustomSearchAPIKey = process.env.GoogleCustomSearchAPIKey_01

/** The Google Custom Search Engine Id */
const GoogleCustomSearchEngineId = process.env.GoogleCustomSearchEngineId_01

/** The logger minimum level */
const LoggerLevel = process.env.LoggerLevel

// ENDPOINTS
/** The url of the Adaptation module endpoint */
const AdaptationEndpoint = process.env.AdaptationEndpoint


export {
    GoogleCustomSearchAPIKey,
    GoogleCustomSearchEngineId,
    AdaptationEndpoint,
    LoggerLevel
}
