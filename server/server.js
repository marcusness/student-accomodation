const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS and JSON parsing
app.use(cors());
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
app.post('/api/students/register', (req, res) => {
  try {
    const studentData = req.body;
    
    // Log the received data
    console.log('Received registration:', studentData);
    
    // Send success response
    res.status(201).json({
      success: true,
      message: 'Student registration received successfully',
      data: studentData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// Export the Express app
module.exports = app;