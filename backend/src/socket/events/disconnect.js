const { leaveRoom } = require('./joinRoom');

const handleDisconnect = async (socket, reason, connectedUsers) => {
  try {
    const user = connectedUsers.get(socket.id);
    
    if (user && user.roomId) {
      await leaveRoom(socket, user.roomId, connectedUsers);
    }
    
    connectedUsers.delete(socket.id);
    
    console.log(`🔌 User disconnected: ${socket.id} (${reason})`);
  } catch (error) {
    console.error('Error handling disconnect:', error);
  }
};

module.exports = { handleDisconnect };
