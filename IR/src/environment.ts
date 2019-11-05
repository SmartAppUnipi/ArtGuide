import dotenv from 'dotenv';

// Load env variables from .env file in the IR folder
const result = dotenv.config();

if (result.error) {
    throw result.error;
}

/** The Google Custom Search APIs Key */
const GoogleCustomSearchAPIKey = process.env.GoogleCustomSearchAPIKey;

/** The Google Custom Search Engine Id */
const GoogleCustomSearchEngineId = process.env.GoogleCustomSearchEngineId;

/** Endpoints */
const AdaptationEndpoint = process.env.AdaptationEndpoint;

export {
    GoogleCustomSearchAPIKey,
    GoogleCustomSearchEngineId,
    AdaptationEndpoint
}
