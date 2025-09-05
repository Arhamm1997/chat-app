const os = require('os');

// Get all local network IPs
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal) {
        ips.push(alias.address);
      }
    }
  }
  return ips;
}

const LOCAL_IPS = getLocalIPs();

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, desktop apps, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow localhost and 127.0.0.1
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow all detected local IPs
    const isLocalIP = LOCAL_IPS.some(ip => origin.includes(ip));
    if (isLocalIP) {
      return callback(null, true);
    }
    
    // Allow common local network ranges
    const localNetworkRegex = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|localhost|127\.0\.0\.1)/;
    if (localNetworkRegex.test(origin)) {
      return callback(null, true);
    }
    
    // Allow file:// protocol for mobile apps
    if (origin.startsWith('file://')) {
      return callback(null, true);
    }
    
    console.log(`🚫 CORS blocked origin: ${origin}`);
    callback(null, false);
  },
  credentials: false, // Disable credentials for easier local access
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-api-key', 
    'x-admin-key',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

module.exports = { corsOptions, LOCAL_IPS };