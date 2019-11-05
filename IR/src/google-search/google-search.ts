import express from 'express';
import fetch from 'node-fetch';
import { GoogleCustomSearchAPIKey, GoogleCustomSearchEngineId } from '../environment';

/**
 * The router that manages all requests to Google Search APIs
 */
const router: express.Router = express.Router();


const googleSearchUrls = {
    restricted: `https://www.googleapis.com/customsearch/v1/siterestrict?key=${GoogleCustomSearchAPIKey}&cx=${GoogleCustomSearchEngineId}&q=`,
    custom: `https://www.googleapis.com/customsearch/v1?key=${GoogleCustomSearchAPIKey}&cx=${GoogleCustomSearchEngineId}&q=`
}

const getAndValidateQuery = (req: express.Request, res: express.Response) => {
    const query: string = req.query.q;

    if (!query) {
        return res.json({
            message: 'Missing required argument q'
        })
    }

    return query;
};

router.get('/restricted/*', async (req, res) => {
    
    const query = getAndValidateQuery(req, res) as string;

    const googleRequest = await fetch(googleSearchUrls.restricted + query);
    const googleResponse = await googleRequest.json();

    res.json(googleResponse);

});

router.get('/custom/*', async (req, res) => {
    
    const query = getAndValidateQuery(req, res) as string;

    const googleRequest = await fetch(googleSearchUrls.custom + query);
    const googleResponse = await googleRequest.json();

    res.json(googleResponse);

});



export default router;