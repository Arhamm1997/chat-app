const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const os = require('os');
require('dotenv').config();

// Import configurations
const connectDB = require('./src/config/database');
const socketHandler = require('./src/socket/socketHandler');

// Import routes
const roomRoutes = require('./src/routes/rooms');
const messageRoutes = require('./src/routes/messages');

const app = express();
const server = http.createServer(app);

// Get local IP address
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIPAddress();
const PORT = process.env.PORT || 5000;

// CORS configuration - Allow local network access
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    `http://${LOCAL_IP}:3000`,
    "http://192.168.1.*:3000", // Common router IP range
    "http://192.168.0.*:3000", // Common router IP range  
    "http://10.0.0.*:3000",    // Common router IP range
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/, // Any 192.168.x.x
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/, // Any 10.x.x.x
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-admin-key"],
  credentials: true,
  optionsSuccessStatus: 200
};

// Socket.IO setup with CORS for local network
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      `http://${LOCAL_IP}:3000`,
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3000$/,
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowEIO3: true
  },
  transports: ['websocket', 'polling'],
  allowRequest: (req, callback) => {
    // Allow all local network requests
    const origin = req.headers.origin;
    const isLocalNetwork = !origin || 
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') ||
      origin.includes('192.168.') ||
      origin.includes('10.0.') ||
      origin.includes(LOCAL_IP);
    
    callback(null, isLocalNetwork);
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    localIP: LOCAL_IP,
    port: PORT
  });
});

// Test route to check if server is working
app.get('/', (req, res) => {
  res.json({
    message: 'Anonymous Chat Backend Server is running!',
    version: '1.0.0',
    localIP: LOCAL_IP,
    accessURL: `http://${LOCAL_IP}:${PORT}`,
    endpoints: {
      health: '/health',
      createRoom: 'POST /api/rooms/create',
      getRoomInfo: 'GET /api/rooms/:roomId',
      getRoomMessages: 'GET /api/messages/:roomId'
    }
  });
});

// API Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// Socket.IO connection handling
socketHandler(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    availableEndpoints: {
      health: 'GET /health',
      createRoom: 'POST /api/rooms/create',
      getRoomInfo: 'GET /api/rooms/:roomId'
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://${LOCAL_IP}:${PORT}`);
  console.log(`🔗 Share this URL with others on your WiFi: http://${LOCAL_IP}:${PORT}`);
  console.log(`📊 Health check: http://${LOCAL_IP}:${PORT}/health`);
});