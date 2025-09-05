const Room = require('../../models/Room');

const handleUserStatusUpdate = async (socket, data, connectedUsers) => {
  try {
    const { roomId, status } = data; // status: 'online', 'away', 'busy'
    const user = connectedUsers.get(socket.id);

    if (!user || user.roomId !== roomId) {
      return;
    }

    // Update user status in room
    await Room.findOneAndUpdate(
      { 
        roomId,
        'users.socketId': socket.id
      },
      {
        $set: {
          'users.$.lastSeen': new Date(),
          'users.$.status': status || 'online'
        }
      }
    );

    // Broadcast status update to room
    socket.to(roomId).emit('userStatusUpdated', {
      username: user.username,
      status: status || 'online'
    });

  } catch (error) {
    console.error('Error updating user status:', error);
  }
};

module.exports = { handleUserStatusUpdate };