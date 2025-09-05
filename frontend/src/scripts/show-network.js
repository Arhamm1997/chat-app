const os = require('os');

function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const networks = [];
  
  console.log('\n🌐 Frontend Network Configuration:\n');
  
  for (const name in interfaces) {
    const iface = interfaces[name];
    iface.forEach(details => {
      if (details.family === 'IPv4' && !details.internal) {
        networks.push({
          interface: name,
          ip: details.address,
          mac: details.mac
        });
        
        console.log(`📡 Interface: ${name}`);
        console.log(`   IP Address: ${details.address}`);
        console.log(`   Frontend URL: http://${details.address}:3000`);
        console.log(`   Backend URL: http://${details.address}:5000`);
        console.log('');
      }
    });
  }
  
  if (networks.length === 0) {
    console.log('❌ No network interfaces found. Make sure you are connected to WiFi.');
    return;
  }
  
  console.log('📱 Share these URLs with others on your WiFi network:');
  networks.forEach(net => {
    console.log(`   http://${net.ip}:3000`);
  });
  
  console.log('\n💡 Instructions:');
  console.log('   1. Start backend: cd backend && npm run dev');
  console.log('   2. Start frontend: npm run dev');
  console.log('   3. Share the URLs above with others');
  console.log('   4. Make sure firewall allows ports 3000 and 5000');
  
  return networks;
}

if (require.main === module) {
  getNetworkInfo();
}

module.exports = { getNetworkInfo };