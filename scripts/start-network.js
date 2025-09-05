const { spawn } = require('child_process');
const { getRecommendedIP } = require('./network-info');

function startWithNetworkConfig() {
  const ip = getRecommendedIP();
  
  console.log('🚀 Starting Chat App with Network Configuration');
  console.log(`📍 Using IP: ${ip}`);
  console.log(`🌐 Chat will be available at: http://${ip}:3000`);
  console.log(`⚙️  API will be available at: http://${ip}:5000`);
  console.log('');

  // Set environment variables
  process.env.NEXT_PUBLIC_API_URL = `http://${ip}:5000`;
  process.env.NEXT_PUBLIC_SOCKET_URL = `http://${ip}:5000`;
  process.env.NEXT_PUBLIC_NETWORK_IP = ip;
  process.env.NETWORK_IP = ip;
  process.env.CORS_ORIGIN = `http://${ip}:3000`;

  // Start backend
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: './backend',
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  // Start frontend with network host
  const frontend = spawn('npm', ['run', 'dev', '--', '-H', '0.0.0.0'], {
    cwd: './frontend', 
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit();
  });

  backend.on('error', (err) => {
    console.error('❌ Backend error:', err);
  });

  frontend.on('error', (err) => {
    console.error('❌ Frontend error:', err);
  });
}

if (require.main === module) {
  startWithNetworkConfig();
}