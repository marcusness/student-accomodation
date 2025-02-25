const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS with specific options
app.use(cors({
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Student registration endpoint
app.post('/api/students/register', async (req, res) => {
  try {
    // Log the incoming request
    console.log('Received registration request:', req.body);
    
    // Send success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: req.body
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Export the Express app
module.exports = app;