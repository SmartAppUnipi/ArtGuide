import express from 'express';
import { GoogleSearchRouter } from './google-search';
import { ScrapingRouter } from './scraping';
import { WikiSearchRouter } from './wiki'
import wiki from 'wikijs';

// Create a new express application instance
const app: express.Application = express();

app.get('/', (req, res) => {
  res.json({
    message: "Example"
  });
});

// Use the router defined into that module
app.use('/google-search', GoogleSearchRouter)
app.use('/scrape', ScrapingRouter)
app.use('/wiki-search', WikiSearchRouter)

export default app;

