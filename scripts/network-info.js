// scripts/network-info.js
const os = require('os');

function getAllNetworkInterfaces() {
  const interfaces = os.networkInterfaces();
  const networkInfo = [];

  for (const [name, interface] of Object.entries(interfaces)) {
    for (const details of interface) {
      if (details.family === 'IPv4' && !details.internal) {
        networkInfo.push({
          name,
          ip: details.address,
          netmask: details.netmask,
          mac: details.mac
        });
      }
    }
  }

  return networkInfo;
}

function displayNetworkInfo() {
  console.log('🌐 Network Information');
  console.log('=====================');
  
  const interfaces = getAllNetworkInterfaces();
  
  if (interfaces.length === 0) {
    console.log('❌ No external network interfaces found');
    console.log('   Make sure you\'re connected to WiFi or Ethernet');
    return;
  }

  interfaces.forEach((iface, index) => {
    console.log(`\n${index + 1}. Interface: ${iface.name}`);
    console.log(`   IP Address: ${iface.ip}`);
    console.log(`   Subnet Mask: ${iface.netmask}`);
    console.log(`   MAC Address: ${iface.mac}`);
    console.log(`   Chat URL: http://${iface.ip}:3000`);
    console.log(`   API URL: http://${iface.ip}:5000`);
  });

  console.log('\n📋 Instructions:');
  console.log('1. Use the IP address from your main network connection (WiFi/Ethernet)');
  console.log('2. Share the Chat URL with others on the same network');
  console.log('3. Make sure ports 3000 and 5000 are not blocked by firewall');
  
  console.log('\n🔧 Quick Setup:');
  console.log('   npm run setup:network');
  console.log('   npm run dev');
}

function getRecommendedIP() {
  const interfaces = getAllNetworkInterfaces();
  
  // Priority: WiFi interfaces first, then Ethernet, then others
  const priorities = ['Wi-Fi', 'WiFi', 'wlan0', 'en0', 'Ethernet', 'eth0', 'en1'];
  
  for (const priority of priorities) {
    const found = interfaces.find(iface => 
      iface.name.toLowerCase().includes(priority.toLowerCase())
    );
    if (found) return found.ip;
  }
  
  // Return first available interface
  return interfaces.length > 0 ? interfaces[0].ip : 'localhost';
}

if (require.main === module) {
  displayNetworkInfo();
  
  const recommended = getRecommendedIP();
  if (recommended !== 'localhost') {
    console.log(`\n✅ Recommended IP: ${recommended}`);
    console.log(`   Recommended Chat URL: http://${recommended}:3000`);
  }
}

module.exports = {
  getAllNetworkInterfaces,
  getRecommendedIP,
  displayNetworkInfo
};

