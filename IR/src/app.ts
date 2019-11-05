import express from 'express';
import { GoogleSearchRouter } from './google-search';
import { ScrapingRouter } from './scraping';
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
app.get('/batman', (req, res) => {
  wiki().page('batman').then(page => page.content()).then(content=> res.json(content));
});

app.get('/wiki', (req, res) => {
  wiki().search('Gioconda').then(data => wiki().page(data.results[0]).then(page => page.categories()).then(console.log));
});

export default app;

