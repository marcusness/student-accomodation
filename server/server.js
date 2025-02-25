const express = require('express');
const app = express();

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export the Express app
module.exports = app;