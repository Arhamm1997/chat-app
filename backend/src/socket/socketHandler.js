const Room = require('../models/Room');
const Message = require('../models/Message');
const { generateUsername } = require('../utils/usernameGenerator');

const socketHandler = (io) => {
  const connectedUsers = new Map(); // socketId -> user info
  const roomUsers = new Map(); // roomId -> Set of socketIds

  console.log('🔌 Socket.IO server initialized');

  io.on('connection', (socket) => {
    const clientIP = socket.handshake.address;
    console.log(`👤 User connected: ${socket.id} from ${clientIP}`);

    // Handle joining a room
    socket.on('joinRoom', async (data) => {
      try {
        console.log(`🚪 Join room request from ${socket.id}:`, data);
        const { roomId, username } = data;
        
        if (!roomId) {
          socket.emit('error', { message: 'Room ID is required' });
          return;
        }

        // Validate room ID format
        const normalizedRoomId = roomId.toUpperCase();
        if (!/^[A-Z0-9]{6}$/.test(normalizedRoomId)) {
          socket.emit('error', { message: 'Invalid room ID format' });
          return;
        }

        // Generate username if not provided
        const finalUsername = username?.trim() || generateUsername();
        console.log(`👤 User ${finalUsername} attempting to join room ${normalizedRoomId}`);

        // Leave previous room if any
        const previousUser = connectedUsers.get(socket.id);
        if (previousUser?.roomId) {
          await leaveRoom(socket, previousUser.roomId);
        }

        // Find the room
        let room = await Room.findOne({ roomId: normalizedRoomId });
        if (!room) {
          socket.emit('error', { message: 'Room not found. Please check the room ID.' });
          return;
        }

        // Check if username is taken in this room
        const usernameExists = room.users.some(
          user => user.username.toLowerCase() === finalUsername.toLowerCase() && 
                  user.socketId !== socket.id
        );

        let actualUsername = finalUsername;
        if (usernameExists) {
          // Generate new username if taken
          actualUsername = generateUsername();
          console.log(`🔄 Username '${finalUsername}' taken, generated new: '${actualUsername}'`);
        }

        // Remove user from previous position in room if exists
        room.users = room.users.filter(u => u.socketId !== socket.id);

        // Add user to room
        const userData = {
          socketId: socket.id,
          username: actualUsername,
          joinedAt: new Date(),
          lastSeen: new Date(),
          isTyping: false,
          status: 'online'
        };

        room.users.push(userData);
        room.lastActivity = new Date();
        await room.save();

        // Join socket room
        socket.join(normalizedRoomId);

        // Update tracking maps
        connectedUsers.set(socket.id, {
          username: actualUsername,
          roomId: normalizedRoomId,
          joinedAt: new Date()
        });

        if (!roomUsers.has(normalizedRoomId)) {
          roomUsers.set(normalizedRoomId, new Set());
        }
        roomUsers.get(normalizedRoomId).add(socket.id);

        // Create and save system message
        const systemMessage = new Message({
          roomId: normalizedRoomId,
          sender: { username: 'System', socketId: 'system' },
          content: `${actualUsername} joined the room`,
          type: 'system'
        });
        await systemMessage.save();

        // Get current online users
        const onlineUsers = room.users.map(u => ({
          username: u.username,
          isOnline: true,
          joinedAt: u.joinedAt,
          isTyping: u.isTyping || false
        }));

        // Send confirmation to user
        socket.emit('joinedRoom', {
          success: true,
          roomId: normalizedRoomId,
          username: actualUsername,
          users: onlineUsers
        });

        // Broadcast new message to room
        socket.to(normalizedRoomId).emit('newMessage', {
          id: systemMessage._id,
          content: systemMessage.content,
          sender: systemMessage.sender,
          type: systemMessage.type,
          createdAt: systemMessage.createdAt
        });

        // Broadcast user joined event
        socket.to(normalizedRoomId).emit('userJoined', {
          username: actualUsername
        });

        // Send updated user list to all users in room
        io.to(normalizedRoomId).emit('userListUpdated', {
          users: onlineUsers
        });

        console.log(`✅ ${actualUsername} successfully joined room ${normalizedRoomId} (${onlineUsers.length} users online)`);

      } catch (error) {
        console.error('❌ Error in joinRoom:', error);
        socket.emit('error', { message: 'Failed to join room. Please try again.' });
      }
    });

    // Handle sending messages
    socket.on('sendMessage', async (data) => {
      try {
        const { roomId, content } = data;
        const user = connectedUsers.get(socket.id);

        if (!user || user.roomId !== roomId) {
          socket.emit('error', { message: 'You are not in this room' });
          return;
        }

        if (!content || !content.trim()) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        if (content.length > 1000) {
          socket.emit('error', { message: 'Message too long (max 1000 characters)' });
          return;
        }

        // Create and save message
        const message = new Message({
          roomId: roomId,
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
          { roomId: roomId },
          { 
            lastActivity: new Date(),
            $inc: { messageCount: 1 }
          }
        );

        // Update user's last seen
        await Room.findOneAndUpdate(
          { 
            roomId: roomId,
            'users.socketId': socket.id
          },
          {
            $set: { 'users.$.lastSeen': new Date() }
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

        // Broadcast message to all users in room
        io.to(roomId).emit('newMessage', messageData);

        console.log(`💬 ${user.username} sent message in ${roomId}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);

      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message. Please try again.' });
      }
    });

    // Handle typing indicators
    socket.on('typing', async (data) => {
      try {
        const { roomId, isTyping } = data;
        const user = connectedUsers.get(socket.id);

        if (!user || user.roomId !== roomId) {
          return;
        }

        // Update typing status in database
        await Room.findOneAndUpdate(
          { 
            roomId: roomId,
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
          isTyping: isTyping
        });

        // Auto-clear typing after 3 seconds
        if (isTyping) {
          setTimeout(async () => {
            try {
              await Room.findOneAndUpdate(
                { 
                  roomId: roomId,
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
              console.error('Error clearing typing status:', error);
            }
          }, 3000);
        }

      } catch (error) {
        console.error('❌ Error handling typing:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      try {
        console.log(`👋 User disconnecting: ${socket.id} (${reason})`);
        
        const user = connectedUsers.get(socket.id);
        if (user?.roomId) {
          await leaveRoom(socket, user.roomId);
        }
        
        // Clean up tracking
        connectedUsers.delete(socket.id);
        
        // Clean up room tracking
        for (const [roomId, socketIds] of roomUsers.entries()) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) {
            roomUsers.delete(roomId);
          }
        }

        console.log(`✅ User ${socket.id} cleaned up`);

      } catch (error) {
        console.error('❌ Error handling disconnect:', error);
      }
    });

    // Handle manual leave room
    socket.on('leaveRoom', async (data) => {
      try {
        const { roomId } = data;
        const user = connectedUsers.get(socket.id);
        
        if (user && user.roomId === roomId) {
          await leaveRoom(socket, roomId);
          socket.emit('leftRoom', { roomId, success: true });
        }
      } catch (error) {
        console.error('❌ Error leaving room:', error);
        socket.emit('error', { message: 'Failed to leave room' });
      }
    });
  });

  // Helper function to leave room
  async function leaveRoom(socket, roomId) {
    try {
      const user = connectedUsers.get(socket.id);
      if (!user) return;

      console.log(`🚪 ${user.username} leaving room ${roomId}`);

      // Leave socket room
      socket.leave(roomId);

      // Remove from tracking
      if (roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id);
      }

      // Remove user from room in database
      const room = await Room.findOne({ roomId });
      if (room) {
        const wasInRoom = room.users.some(u => u.socketId === socket.id);
        
        if (wasInRoom) {
          room.users = room.users.filter(u => u.socketId !== socket.id);
          room.lastActivity = new Date();
          await room.save();

          // Create system message
          const systemMessage = new Message({
            roomId: roomId,
            sender: { username: 'System', socketId: 'system' },
            content: `${user.username} left the room`,
            type: 'system'
          });
          await systemMessage.save();

          // Broadcast system message to room
          socket.to(roomId).emit('newMessage', {
            id: systemMessage._id,
            content: systemMessage.content,
            sender: systemMessage.sender,
            type: systemMessage.type,
            createdAt: systemMessage.createdAt
          });

          // Broadcast user left event
          socket.to(roomId).emit('userLeft', {
            username: user.username
          });

          // Send updated user list
          const onlineUsers = room.users.map(u => ({
            username: u.username,
            isOnline: true,
            joinedAt: u.joinedAt,
            isTyping: u.isTyping || false
          }));

          socket.to(roomId).emit('userListUpdated', {
            users: onlineUsers
          });

          console.log(`✅ ${user.username} left room ${roomId} (${onlineUsers.length} users remaining)`);
        }
      }

      // Update user's room info
      if (connectedUsers.has(socket.id)) {
        const userInfo = connectedUsers.get(socket.id);
        userInfo.roomId = null;
        connectedUsers.set(socket.id, userInfo);
      }

    } catch (error) {
      console.error('❌ Error leaving room:', error);
    }
  }

  // Cleanup inactive users every 5 minutes
  setInterval(async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const result = await Room.updateMany(
        {},
        {
          $pull: {
            users: {
              lastSeen: { $lt: fiveMinutesAgo }
            }
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`🧹 Cleaned up inactive users from ${result.modifiedCount} rooms`);
        
        // Broadcast updated user lists to affected rooms
        const activeRooms = await Room.find({ 'users.0': { $exists: true } });
        for (const room of activeRooms) {
          const onlineUsers = room.users.map(u => ({
            username: u.username,
            isOnline: true,
            joinedAt: u.joinedAt,
            isTyping: u.isTyping || false
          }));
          
          io.to(room.roomId).emit('userListUpdated', {
            users: onlineUsers
          });
        }
      }
    } catch (error) {
      console.error('Error cleaning up inactive users:', error);
    }
  }, 5 * 60 * 1000);

  // Log server stats every 10 minutes
  setInterval(() => {
    console.log(`📊 Server Stats: ${connectedUsers.size} connected users, ${roomUsers.size} active rooms`);
  }, 10 * 60 * 1000);

  return io;
};

module.exports = socketHandler;