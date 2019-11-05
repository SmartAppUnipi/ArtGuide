import express from 'express';
import { parse } from './scraping'

/**
 * The router that manages all requests to scraping module
 */
const router: express.Router = express.Router();


router.get('/*', async (req, res) => {

    const url = req.query.url as string;
    
    const response = await parse(url);

    res.json(response);

});

export default router;