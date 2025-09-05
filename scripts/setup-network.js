// scripts/setup-network.js
const os = require('os');
const fs = require('fs');
const path = require('path');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  let ipAddress = 'localhost';
  
  // Priority order: WiFi, Ethernet, others
  const priorityOrder = ['Wi-Fi', 'WiFi', 'wlan0', 'eth0', 'en0', 'en1'];
  
  for (const priority of priorityOrder) {
    if (interfaces[priority]) {
      for (const interface of interfaces[priority]) {
        if (interface.family === 'IPv4' && !interface.internal) {
          return interface.address;
        }
      }
    }
  }
  
  // If no priority interface found, get first available
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return ipAddress;
}

function updateBackendEnv(networkIP) {
  const backendEnvPath = path.join(__dirname, '../backend/.env');
  const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
NODE_ENV=development
NETWORK_IP=${networkIP}
CORS_ORIGIN=http://${networkIP}:3000
`;

  fs.writeFileSync(backendEnvPath, envContent);
  console.log(`✅ Updated backend/.env with IP: ${networkIP}`);
}

function createFrontendConfig(networkIP) {
  const frontendConfigPath = path.join(__dirname, '../frontend/next.config.js');
  const configContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: 'http://${networkIP}:5000',
    NEXT_PUBLIC_SOCKET_URL: 'http://${networkIP}:5000',
    NEXT_PUBLIC_NETWORK_IP: '${networkIP}'
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig
`;

  fs.writeFileSync(frontendConfigPath, configContent);
  console.log(`✅ Created/Updated frontend/next.config.js with IP: ${networkIP}`);
}

function createNetworkInstructions(networkIP) {
  const instructionsPath = path.join(__dirname, '../NETWORK_SETUP.md');
  const instructions = `# Network Setup Instructions

## Your Network Configuration
- **Network IP**: ${networkIP}
- **Backend URL**: http://${networkIP}:5000
- **Frontend URL**: http://${networkIP}:3000

## How to Use:

### 1. Start the Application
\`\`\`bash
# In the root directory
npm run dev
\`\`\`

### 2. Access from Different Devices
- **On this computer**: http://localhost:3000 or http://${networkIP}:3000
- **On other devices in the same network**: http://${networkIP}:3000

### 3. Sharing with Others
Tell others to open their browser and go to:
**http://${networkIP}:3000**

### 4. Troubleshooting
- Make sure both devices are on the same WiFi network
- Check if your firewall is blocking ports 3000 and 5000
- Try accessing http://${networkIP}:5000/health to test backend connectivity

### 5. Finding Your Network IP (Manual)
If the auto-detection doesn't work:

**Windows:**
\`\`\`cmd
ipconfig
\`\`\`
Look for "IPv4 Address" under your network adapter.

**Mac/Linux:**
\`\`\`bash
ifconfig | grep "inet " | grep -v 127.0.0.1
\`\`\`

**Alternative:**
\`\`\`bash
hostname -I
\`\`\`

## Security Note
This configuration allows anyone on your local network to access the chat app.
Do not use this setup on public or untrusted networks.
`;

  fs.writeFileSync(instructionsPath, instructions);
  console.log(`✅ Created NETWORK_SETUP.md with instructions`);
}

function main() {
  console.log('🔍 Detecting network IP address...');
  
  const networkIP = getLocalIPAddress();
  
  console.log(`📍 Network IP detected: ${networkIP}`);
  
  if (networkIP === 'localhost') {
    console.log('⚠️  Could not detect network IP. Using localhost.');
    console.log('   You may need to manually configure the IP address.');
  }
  
  try {
    updateBackendEnv(networkIP);
    createFrontendConfig(networkIP);
    createNetworkInstructions(networkIP);
    
    console.log('');
    console.log('🎉 Network setup complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Run: npm run dev');
    console.log(`2. Share this URL with others: http://${networkIP}:3000`);
    console.log('3. Check NETWORK_SETUP.md for detailed instructions');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getLocalIPAddress, updateBackendEnv, createFrontendConfig };