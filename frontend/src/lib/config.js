// Get network configuration from environment or detect automatically
function getNetworkConfig() {
  // First try environment variables
  if (typeof window !== 'undefined') {
    // Client side - use environment variables set by Next.js
    return {
      API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
      NETWORK_IP: process.env.NEXT_PUBLIC_NETWORK_IP || 'localhost'
    };
  } else {
    // Server side - detect network IP
    const os = require('os');
    const interfaces = os.networkInterfaces();
    
    for (const devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          const ip = alias.address;
          return {
            API_URL: `http://${ip}:5000`,
            SOCKET_URL: `http://${ip}:5000`,
            NETWORK_IP: ip
          };
        }
      }
    }
    
    // Fallback to localhost
    return {
      API_URL: 'http://localhost:5000',
      SOCKET_URL: 'http://localhost:5000',
      NETWORK_IP: 'localhost'
    };
  }
}

export const API_CONFIG = getNetworkConfig();

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🌐 Frontend API Config:', API_CONFIG);
}