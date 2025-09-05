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

// Get all local IP addresses
function getLocalIPAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal) {
        addresses.push(alias.address);
      }
    }
  }
  return addresses;
}

const LOCAL_IPS = getLocalIPAddresses();
const PRIMARY_IP = LOCAL_IPS[0] || 'localhost';
const PORT = process.env.PORT || 5000;

console.log('🌐 Available Network IPs:', LOCAL_IPS);

// Very permissive CORS for local network
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost and 127.0.0.1
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow any local network IP
    const isLocalNetwork = LOCAL_IPS.some(ip => origin.includes(ip)) ||
                          /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin);
    
    callback(null, isLocalNetwork);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-admin-key"],
  credentials: false, // Set to false for easier local access
  optionsSuccessStatus: 200
};

// Socket.IO with very permissive CORS
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      callback(null, true); // Allow all origins for local development
    },
    methods: ["GET", "POST"],
    credentials: false,
    allowEIO3: true
  },
  transports: ['websocket', 'polling'],
  allowRequest: (req, callback) => {
    callback(null, true); // Allow all requests
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced request logging
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} from ${clientIP}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    localIPs: LOCAL_IPS,
    primaryIP: PRIMARY_IP,
    port: PORT,
    accessURLs: LOCAL_IPS.map(ip => `http://${ip}:${PORT}`)
  });
});

// Main route with network info
app.get('/', (req, res) => {
  res.json({
    message: 'Anonymous Chat Backend Server is running!',
    version: '1.0.0',
    networkInfo: {
      localIPs: LOCAL_IPS,
      primaryIP: PRIMARY_IP,
      accessURLs: LOCAL_IPS.map(ip => `http://${ip}:${PORT}`),
      frontendURLs: LOCAL_IPS.map(ip => `http://${ip}:3000`)
    },
    endpoints: {
      health: '/health',
      createRoom: 'POST /api/rooms/create',
      getRoomInfo: 'GET /api/rooms/:roomId',
      getRoomMessages: 'GET /api/messages/:roomId'
    }
  });
});

// Network info endpoint
app.get('/network', (req, res) => {
  res.json({
    success: true,
    localIPs: LOCAL_IPS,
    primaryIP: PRIMARY_IP,
    backendURLs: LOCAL_IPS.map(ip => `http://${ip}:${PORT}`),
    frontendURLs: LOCAL_IPS.map(ip => `http://${ip}:3000`),
    shareMessage: `Share these URLs with others on your WiFi network:\n${LOCAL_IPS.map(ip => `Frontend: http://${ip}:3000`).join('\n')}`
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
      network: 'GET /network',
      createRoom: 'POST /api/rooms/create',
      getRoomInfo: 'GET /api/rooms/:roomId'
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Anonymous Chat Server Started Successfully!`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🔗 Access URLs:`);
  console.log(`   Local: http://localhost:${PORT}`);
  
  LOCAL_IPS.forEach(ip => {
    console.log(`   Network: http://${ip}:${PORT}`);
  });
  
  console.log(`\n📱 Share these URLs for WiFi access:`);
  LOCAL_IPS.forEach(ip => {
    console.log(`   Frontend: http://${ip}:3000`);
    console.log(`   Backend: http://${ip}:${PORT}`);
  });
  
  console.log(`\n📊 Health check: http://${PRIMARY_IP}:${PORT}/health`);
  console.log(`🌐 Network info: http://${PRIMARY_IP}:${PORT}/network`);
  console.log(`\n✅ Server ready to accept connections from same WiFi network!`);
});