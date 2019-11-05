import express from 'express';
import { WikiSearch } from './wiki.module'

/**
 * The router that manages all requests to Wikipedia APIs
 */
const router: express.Router = express.Router();

/** The Wikipedia API module */
const wiki = new WikiSearch()

const pageFields = ["content", "references", "links", "images", "summary"]


const getAndValidateQuery = (req: express.Request, res: express.Response) => {
    const query : string = req.query.q;

    if (!query) {
        return res.json({
            message: 'Missing required argument q'
        })
    }

    return query;
};

const getAndValidateLanguage = (req: express.Request, res: express.Response) => {
    const lang : string = req.query.l;

    if(lang.length > 2){
        return res.json({
            message: 'Invalid format for language attribute'
        })
    }  

    if (!lang){
        return "en";
    }

    return lang;
}

const getAndValidateField = (req: express.Request, res: express.Response) => {
    const field : string = req.query.f;

    if(!field){
        return res.json({
            message: 'Missing required argument f!'
        })
    }  

    if (!pageFields.includes(field)){
        return res.json({
            message: 'Not supported field extraction!'
        })
    }

    return field;
}


router.get('/results/*', async (req, res) => {

    const query = getAndValidateQuery(req, res) as string;
    const language = getAndValidateLanguage(req, res) as string;


    wiki.resultsList(query, language).then(data => res.json(data.results));

});

router.get('/page/*', async (req, res) => {

    const query = getAndValidateQuery(req, res) as string;
    const language = getAndValidateLanguage(req, res) as string;
    const field = getAndValidateField(req, res) as string;

    wiki.getField(query, language, field).then( response => res.json(response));

});


export default router;