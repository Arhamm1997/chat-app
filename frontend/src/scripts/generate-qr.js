const QRCode = require('qrcode');
const os = require('os');

async function generateQRCodes() {
  try {
    const interfaces = os.networkInterfaces();
    const networks = [];
    
    for (const name in interfaces) {
      const iface = interfaces[name];
      iface.forEach(details => {
        if (details.family === 'IPv4' && !details.internal) {
          networks.push(details.address);
        }
      });
    }
    
    if (networks.length === 0) {
      console.log('❌ No network interfaces found. Make sure you are connected to WiFi.');
      return;
    }
    
    console.log('\n📱 QR Codes for Frontend Access:\n');
    
    for (const ip of networks) {
      const url = `http://${ip}:3000`;
      try {
        const qr = await QRCode.toString(url, { 
          type: 'terminal',
          small: true,
          width: 60
        });
        
        console.log(`🔗 Frontend URL: ${url}`);
        console.log(qr);
        console.log('─'.repeat(50));
      } catch (error) {
        console.error(`❌ Error generating QR for ${ip}:`, error.message);
      }
    }
    
    console.log('📸 Instructions:');
    console.log('   1. Make sure backend is running on port 5000');
    console.log('   2. Make sure frontend is running on port 3000');
    console.log('   3. Scan QR code with phone camera');
    console.log('   4. Make sure phone is on same WiFi network');
    
  } catch (error) {
    console.error('❌ Error generating QR codes:', error.message);
  }
}

if (require.main === module) {
  generateQRCodes();
}

module.exports = { generateQRCodes };