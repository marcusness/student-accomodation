const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

// Test endpoint to verify routing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API endpoint working' });
});

// Registration endpoint
app.post('/api/students/register', async (req, res) => {
  try {
    console.log('Received data:', req.body);
    res.json({
      success: true,
      message: 'Registration successful',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export the Express app
module.exports = app;