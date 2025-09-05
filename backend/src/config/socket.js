const socketIo = require('socket.io');

const createSocketServer = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  // Middleware for socket authentication if needed
  io.use((socket, next) => {
    // Add any socket authentication logic here
    console.log(`Socket connection attempt: ${socket.id}`);
    next();
  });

  return io;
};

module.exports = { createSocketServer };
