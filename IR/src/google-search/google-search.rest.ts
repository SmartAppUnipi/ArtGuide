import express from 'express';
import { GoogleSearch } from './google-search.module'

/**
 * The router that manages all requests to Google Search APIs
 */
const router: express.Router = express.Router();

/** The Google Search module */
const googleSearch = new GoogleSearch();


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
    const response = await googleSearch.queryRestricted(query);

    res.json(response);

});

router.get('/custom/*', async (req, res) => {

    const query = getAndValidateQuery(req, res) as string;
    const response = await googleSearch.queryCustom(query);

    res.json(response);

});



export default router;