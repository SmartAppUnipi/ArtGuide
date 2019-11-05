import express from 'express';
import { GoogleSearchRouter } from './google-search';

// Create a new express application instance
const app: express.Application = express();

app.get('/', (req, res) => {
  res.json({
    message: "Example"
  });
});

// Use the router defined into that module
app.use('/google-search', GoogleSearchRouter)

export default app;

