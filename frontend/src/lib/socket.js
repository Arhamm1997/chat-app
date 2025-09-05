import { io } from 'socket.io-client';
import { API_CONFIG } from './config.js';

let socket = null;

export function getSocket() {
  if (!socket) {
    console.log('🔌 Connecting to Socket.IO server:', API_CONFIG.SOCKET_URL);
    
    socket = io(API_CONFIG.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 10,
      forceNew: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected to backend:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Reconnect manually if server disconnected the socket
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection failed:', error);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  }
  
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected manually');
  }
}

// Export config for debugging
export { API_CONFIG };