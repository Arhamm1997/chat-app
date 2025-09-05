const Room = require('../../models/Room');

const handleTyping = async (socket, data, connectedUsers) => {
  try {
    const { roomId, isTyping } = data;
    const user = connectedUsers.get(socket.id);

    if (!user || user.roomId !== roomId) {
      return; // Silently ignore if user not in room
    }

    // Update typing status in database
    await Room.findOneAndUpdate(
      { 
        roomId,
        'users.socketId': socket.id
      },
      {
        $set: {
          'users.$.isTyping': isTyping,
          'users.$.lastSeen': new Date()
        }
      }
    );

    // Broadcast typing status to other users in room
    socket.to(roomId).emit('userTyping', {
      username: user.username,
      isTyping
    });

    // Auto-clear typing status after 5 seconds
    if (isTyping) {
      setTimeout(async () => {
        try {
          await Room.findOneAndUpdate(
            { 
              roomId,
              'users.socketId': socket.id
            },
            {
              $set: { 'users.$.isTyping': false }
            }
          );
          
          socket.to(roomId).emit('userTyping', {
            username: user.username,
            isTyping: false
          });
        } catch (error) {
          console.error('Error auto-clearing typing status:', error);
        }
      }, 5000);
    }

  } catch (error) {
    console.error('Error handling typing:', error);
  }
};

module.exports = { handleTyping };