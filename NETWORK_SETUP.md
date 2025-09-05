# Network Setup Instructions

## Your Network Configuration
- **Network IP**: 192.168.18.10
- **Backend URL**: http://192.168.18.10:5000
- **Frontend URL**: http://192.168.18.10:3000

## How to Use:

### 1. Start the Application
```bash
# In the root directory
npm run dev
```

### 2. Access from Different Devices
- **On this computer**: http://localhost:3000 or http://192.168.18.10:3000
- **On other devices in the same network**: http://192.168.18.10:3000

### 3. Sharing with Others
Tell others to open their browser and go to:
**http://192.168.18.10:3000**

### 4. Troubleshooting
- Make sure both devices are on the same WiFi network
- Check if your firewall is blocking ports 3000 and 5000
- Try accessing http://192.168.18.10:5000/health to test backend connectivity

### 5. Finding Your Network IP (Manual)
If the auto-detection doesn't work:

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your network adapter.

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Alternative:**
```bash
hostname -I
```

## Security Note
This configuration allows anyone on your local network to access the chat app.
Do not use this setup on public or untrusted networks.
