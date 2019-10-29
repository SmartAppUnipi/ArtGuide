import express from 'express';

// Create a new express application instance
const app: express.Application = express();

app.get('/', (req, res) => {
  res.json({
    message: "Example"
  });
});

export default app;

