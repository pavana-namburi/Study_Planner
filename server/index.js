require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || false // In production, specify allowed origins
    : true, // In development, allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Enable JSON request body parsing

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/test', (req, res) => {
  res.json({ "message": "Server working" });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running successfully on port ${port}`);
});