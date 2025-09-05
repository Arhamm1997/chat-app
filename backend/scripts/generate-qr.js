const QRCode = require('qrcode');
const os = require('os');

async function generateQRCodes() {
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
    console.log('❌ No network interfaces found');
    return;
  }
  
  console.log('\n📱 QR Codes for WiFi Sharing:\n');
  
  for (const ip of networks) {
    const url = `http://${ip}:3000`;
    try {
      const qr = await QRCode.toString(url, { 
        type: 'terminal',
        small: true 
      });
      
      console.log(`🔗 ${url}`);
      console.log(qr);
      console.log('─'.repeat(40));
    } catch (error) {
      console.error(`Error generating QR for ${ip}:`, error.message);
    }
  }
  
  console.log('💡 Scan these QR codes with phone camera to access the chat app');
}

generateQRCodes();