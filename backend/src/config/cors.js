// backend/src/config/cors.js - REPLACE COMPLETELY
const corsOptions = {
  origin: function (origin, callback) {
    // Allow all origins in development
    callback(null, true);
  },
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  optionsSuccessStatus: 200
};

module.exports = { corsOptions }