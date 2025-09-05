const Room = require('../../models/Room');
const Message = require('../../models/Message');
const { generateUsername } = require('../../utils/usernameGenerator');
const { validateRoomId, validateUsername } = require('../../utils/validation');

const handleJoinRoom = async (socket, data, connectedUsers) => {
  try {
    const { roomId, username } = data;
    
    // Validate room ID
    const roomValidation = validateRoomId(roomId);
    if (!roomValidation.isValid) {
      socket.emit('error', { message: roomValidation.error });
      return;
    }

    const finalUsername = username || generateUsername();
    
    // Validate username
    const usernameValidation = validateUsername(finalUsername);
    if (!usernameValidation.isValid) {
      socket.emit('error', { message: usernameValidation.error });
      return;
    }

    // Leave previous room if any
    if (connectedUsers.has(socket.id)) {
      const prevRoomId = connectedUsers.get(socket.id).roomId;
      if (prevRoomId) {
        await leaveRoom(socket, prevRoomId, connectedUsers);
      }
    }

    // Join the new room
    socket.join(roomId);

    // Create or update room
    let room = await Room.findOne({ roomId });
    if (!room) {
      room = new Room({ roomId });
    }

    // Check if username is already taken in this room
    const existingUser = room.users.find(u => u.username === finalUsername && u.socketId !== socket.id);
    if (existingUser) {
      socket.emit('error', { message: 'Username already taken in this room' });
      return;
    }

    // Add or update user in room
    const userIndex = room.users.findIndex(u => u.socketId === socket.id);
    if (userIndex > -1) {
      room.users[userIndex].username = finalUsername;
      room.users[userIndex].lastSeen = new Date();
      room.users[userIndex].isTyping = false;
    } else {
      room.users.push({
        socketId: socket.id,
        username: finalUsername,
        joinedAt: new Date(),
        lastSeen: new Date(),
        isTyping: false
      });
    }

    room.lastActivity = new Date();
    await room.save();

    // Store user info
    connectedUsers.set(socket.id, {
      username: finalUsername,
      roomId,
      joinedAt: new Date()
    });

    // Create system message
    const systemMessage = new Message({
      roomId,
      sender: { username: 'System', socketId: 'system' },
      content: `${finalUsername} joined the room`,
      type: 'system'
    });
    await systemMessage.save();

    // Send confirmation to user
    socket.emit('joinedRoom', {
      roomId,
      username: finalUsername,
      users: room.users.map(u => ({
        username: u.username,
        isOnline: true,
        joinedAt: u.joinedAt,
        isTyping: u.isTyping
      }))
    });

    // Broadcast to room that user joined
    socket.to(roomId).emit('userJoined', {
      username: finalUsername,
      message: {
        id: systemMessage._id,
        content: systemMessage.content,
        sender: systemMessage.sender,
        type: systemMessage.type,
        createdAt: systemMessage.createdAt
      }
    });

    // Send updated user list to all users in room
    socket.to(roomId).emit('userListUpdated', {
      users: room.users.map(u => ({
        username: u.username,
        isOnline: true,
        joinedAt: u.joinedAt,
        isTyping: u.isTyping
      }))
    });

    console.log(`👤 ${finalUsername} joined room ${roomId}`);

  } catch (error) {
    console.error('Error in joinRoom:', error);
    socket.emit('error', { message: 'Failed to join room' });
  }
};

// Helper function to leave room
const leaveRoom = async (socket, roomId, connectedUsers) => {
  if (!roomId) return;

  try {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    socket.leave(roomId);

    // Remove user from room
    const room = await Room.findOne({ roomId });
    if (room) {
      room.users = room.users.filter(u => u.socketId !== socket.id);
      room.lastActivity = new Date();
      await room.save();

      // Create system message
      const systemMessage = new Message({
        roomId,
        sender: { username: 'System', socketId: 'system' },
        content: `${user.username} left the room`,
        type: 'system'
      });
      await systemMessage.save();

      // Broadcast to room that user left
      socket.to(roomId).emit('userLeft', {
        username: user.username,
        message: {
          id: systemMessage._id,
          content: systemMessage.content,
          sender: systemMessage.sender,
          type: systemMessage.type,
          createdAt: systemMessage.createdAt
        }
      });

      // Send updated user list
      socket.to(roomId).emit('userListUpdated', {
        users: room.users.map(u => ({
          username: u.username,
          isOnline: true,
          joinedAt: u.joinedAt,
          isTyping: u.isTyping
        }))
      });
    }

    console.log(`👋 ${user.username} left room ${roomId}`);
  } catch (error) {
    console.error('Error leaving room:', error);
  }
};

module.exports = { handleJoinRoom, leaveRoom };
