import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(8080, () => {
  console.log('Health check server running on port 8080');
}); 