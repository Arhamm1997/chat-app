
module.exports = {
  // Server configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp',
  
  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Rate limiting
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  
  // Socket.IO configuration
  SOCKET_CONFIG: {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  },
  
  // Message limits
  MESSAGE_LIMITS: {
    maxLength: 1000,
    minLength: 1
  },
  
  // Room limits
  ROOM_LIMITS: {
    maxNameLength: 50,
    idLength: 6
  },
  
  // User limits
  USER_LIMITS: {
    maxUsernameLength: 20,
    minUsernameLength: 3
  }
};
