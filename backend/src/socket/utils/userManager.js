const userManager = {
  // Validate socket connection
  validateConnection: (socket) => {
    return {
      isValid: true,
      socketId: socket.id,
      connectedAt: new Date(),
      userAgent: socket.handshake.headers['user-agent'],
      ipAddress: socket.handshake.address
    };
  },

  // Generate unique session ID
  generateSessionId: () => {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  },

  // Check if username is available in room
  isUsernameAvailable: async (roomId, username, excludeSocketId = null) => {
    try {
      const Room = require('../../models/Room');
      const room = await Room.findOne({ roomId });
      
      if (!room) return true;
      
      const existingUser = room.users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.socketId !== excludeSocketId
      );
      
      return !existingUser;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  },

  // Get user connection info
  getUserInfo: (connectedUsers, socketId) => {
    return connectedUsers.get(socketId) || null;
  },

  // Update user last seen
  updateUserLastSeen: async (roomId, socketId) => {
    try {
      const Room = require('../../models/Room');
      await Room.findOneAndUpdate(
        { 
          roomId,
          'users.socketId': socketId
        },
        {
          $set: { 'users.$.lastSeen': new Date() }
        }
      );
    } catch (error) {
      console.error('Error updating user last seen:', error);
    }
  }
};

module.exports = userManager;