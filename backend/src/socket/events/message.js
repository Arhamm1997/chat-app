const Message = require('../../models/Message');
const Room = require('../../models/Room');
const { validateMessageContent } = require('../../utils/validation');

const handleSendMessage = async (socket, data, connectedUsers) => {
  try {
    const { roomId, content } = data;
    const user = connectedUsers.get(socket.id);

    if (!user || user.roomId !== roomId) {
      socket.emit('error', { message: 'You are not in this room' });
      return;
    }

    // Validate message content
    const validation = validateMessageContent(content);
    if (!validation.isValid) {
      socket.emit('error', { message: validation.error });
      return;
    }

    // Create and save message
    const message = new Message({
      roomId,
      sender: {
        username: user.username,
        socketId: socket.id
      },
      content: content.trim(),
      type: 'message'
    });

    await message.save();

    // Update room activity and message count
    await Room.findOneAndUpdate(
      { roomId },
      { 
        lastActivity: new Date(),
        $inc: { messageCount: 1 }
      }
    );

    const messageData = {
      id: message._id,
      content: message.content,
      sender: {
        username: user.username,
        socketId: socket.id
      },
      createdAt: message.createdAt,
      type: 'message'
    };

    // Broadcast message to all users in room (including sender)
    socket.to(roomId).emit('newMessage', messageData);
    socket.emit('newMessage', messageData);

    console.log(`💬 ${user.username} sent message in ${roomId}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`);

  } catch (error) {
    console.error('Error sending message:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
};

module.exports = { handleSendMessage };
