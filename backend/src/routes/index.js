const express = require('express');
const router = express.Router();
const roomRoutes = require('./rooms');
const messageRoutes = require('./messages');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
router.use('/api/rooms', roomRoutes);
router.use('/api/messages', messageRoutes);

// Root endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Anonymous Chat API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      rooms: '/api/rooms',
      messages: '/api/messages'
    }
  });
});

module.exports = router;