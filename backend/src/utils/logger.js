// backend/src/utils/logger.js
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = {
  log: (level, message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    const logString = JSON.stringify(logEntry) + '\n';

    // Console output
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);

    // File output
    const logFile = path.join(logDir, `${level}.log`);
    const combinedFile = path.join(logDir, 'combined.log');

    fs.appendFileSync(logFile, logString);
    fs.appendFileSync(combinedFile, logString);
  },

  info: (message, meta) => logger.log('info', message, meta),
  warn: (message, meta) => logger.log('warn', message, meta),
  error: (message, meta) => logger.log('error', message, meta),
  debug: (message, meta) => logger.log('debug', message, meta),

  // Socket-specific logging
  socket: {
    connection: (socketId, userAgent, ip) => {
      logger.info('Socket connected', { socketId, userAgent, ip });
    },
    disconnection: (socketId, reason) => {
      logger.info('Socket disconnected', { socketId, reason });
    },
    joinRoom: (socketId, username, roomId) => {
      logger.info('User joined room', { socketId, username, roomId });
    },
    leaveRoom: (socketId, username, roomId) => {
      logger.info('User left room', { socketId, username, roomId });
    },
    message: (socketId, username, roomId, messageLength) => {
      logger.info('Message sent', { socketId, username, roomId, messageLength });
    },
    error: (socketId, error, context) => {
      logger.error('Socket error', { socketId, error: error.message, context });
    }
  }
};

module.exports = logger;
