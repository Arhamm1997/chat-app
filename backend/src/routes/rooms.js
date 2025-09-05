const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Message = require('../models/Message');
const { generateRoomId } = require('../utils/generateId');

// Create a new room
router.post('/create', async (req, res) => {
  try {
    console.log('📝 Creating new room with data:', req.body);
    
    const { name } = req.body;
    
    // Validate room name if provided
    if (name && typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Room name must be a string'
      });
    }

    if (name && name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Room name cannot exceed 50 characters'
      });
    }

    const roomId = generateRoomId();
    console.log('🎲 Generated room ID:', roomId);
    
    const room = new Room({
      roomId,
      name: name?.trim() || 'Anonymous Chat Room',
      users: [],
      messageCount: 0,
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date()
    });

    console.log('💾 Saving room to database...');
    const savedRoom = await room.save();
    console.log('✅ Room saved successfully:', savedRoom.roomId);

    res.status(201).json({
      success: true,
      roomId: savedRoom.roomId,
      name: savedRoom.name,
      message: 'Room created successfully',
      createdAt: savedRoom.createdAt,
      userCount: 0,
      messageCount: 0
    });

    console.log(`🏠 Room created successfully: ${roomId} - "${savedRoom.name}"`);
    
  } catch (error) {
    console.error('❌ Error creating room:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(500).json({
        success: false,
        message: 'Room ID collision occurred. Please try again.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get room info
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log('🔍 Fetching room info for:', roomId);
    
    // Validate room ID format
    const normalizedRoomId = roomId.toUpperCase();
    if (!normalizedRoomId || normalizedRoomId.length !== 6 || !/^[A-Z0-9]{6}$/.test(normalizedRoomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format. Room ID must be 6 characters long and contain only letters and numbers.'
      });
    }
    
    const room = await Room.findOne({ roomId: normalizedRoomId });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Filter out only truly online users (last seen within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = room.users.filter(user => user.lastSeen > fiveMinutesAgo);

    console.log(`✅ Room found: ${room.roomId} with ${onlineUsers.length} online users`);

    res.json({
      success: true,
      room: {
        roomId: room.roomId,
        name: room.name,
        userCount: onlineUsers.length,
        messageCount: room.messageCount || 0,
        isActive: room.isActive,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
        users: onlineUsers.map(user => ({
          username: user.username,
          joinedAt: user.joinedAt,
          isOnline: true,
          isTyping: user.isTyping || false,
          status: user.status || 'online'
        }))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Check if room exists
router.get('/:roomId/exists', async (req, res) => {
  try {
    const { roomId } = req.params;
    console.log('🔍 Checking if room exists:', roomId);
    
    const normalizedRoomId = roomId.toUpperCase();
    const room = await Room.findOne({ roomId: normalizedRoomId });
    
    if (room) {
      // Count online users
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const onlineUsers = room.users.filter(user => user.lastSeen > fiveMinutesAgo);
      
      res.json({
        success: true,
        exists: true,
        room: {
          name: room.name,
          userCount: onlineUsers.length,
          messageCount: room.messageCount || 0,
          lastActivity: room.lastActivity,
          isActive: room.isActive
        }
      });
    } else {
      res.json({
        success: true,
        exists: false
      });
    }
  } catch (error) {
    console.error('❌ Error checking room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check room',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get online users in room
router.get('/:roomId/users', async (req, res) => {
  try {
    const { roomId } = req.params;
    const normalizedRoomId = roomId.toUpperCase();
    
    const room = await Room.findOne({ roomId: normalizedRoomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Filter for online users only
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = room.users
      .filter(user => user.lastSeen > fiveMinutesAgo)
      .map(user => ({
        username: user.username,
        joinedAt: user.joinedAt,
        lastSeen: user.lastSeen,
        isOnline: true,
        isTyping: user.isTyping || false,
        status: user.status || 'online'
      }));

    res.json({
      success: true,
      users: onlineUsers,
      count: onlineUsers.length
    });

  } catch (error) {
    console.error('❌ Error fetching room users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all rooms (for debugging/admin)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // Max 50 rooms per page
    const skip = (page - 1) * limit;

    console.log('📋 Fetching all rooms, page:', page, 'limit:', limit);

    // Only get active rooms with recent activity
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rooms = await Room.find({
      isActive: true,
      lastActivity: { $gte: oneDayAgo }
    })
      .select('roomId name users messageCount createdAt lastActivity isActive')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Room.countDocuments({
      isActive: true,
      lastActivity: { $gte: oneDayAgo }
    });

    // Process rooms to show only online users
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const processedRooms = rooms.map(room => {
      const onlineUsers = room.users ? room.users.filter(user => user.lastSeen > fiveMinutesAgo) : [];
      return {
        roomId: room.roomId,
        name: room.name,
        userCount: onlineUsers.length,
        messageCount: room.messageCount || 0,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
        isActive: room.isActive
      };
    });

    res.json({
      success: true,
      rooms: processedRooms,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Clean up inactive rooms
router.post('/cleanup', async (req, res) => {
  try {
    const hoursInactive = parseInt(req.query.hours) || 24;
    const cutoffTime = new Date(Date.now() - (hoursInactive * 60 * 60 * 1000));

    console.log(`🧹 Cleaning up rooms inactive for ${hoursInactive} hours`);

    // Delete rooms with no users and old activity
    const result = await Room.deleteMany({
      $and: [
        { 'users.0': { $exists: false } }, // No users
        { lastActivity: { $lt: cutoffTime } } // Old activity
      ]
    });

    // Also clean up users from all rooms
    const userCleanup = await Room.updateMany(
      {},
      {
        $pull: {
          users: {
            lastSeen: { $lt: new Date(Date.now() - 10 * 60 * 1000) } // Remove users inactive for 10 minutes
          }
        }
      }
    );

    res.json({
      success: true,
      message: `Cleanup completed`,
      roomsDeleted: result.deletedCount,
      usersRemoved: userCleanup.modifiedCount
    });

    console.log(`✅ Cleanup completed: ${result.deletedCount} rooms deleted, ${userCleanup.modifiedCount} rooms had users removed`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup rooms',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete a specific room (admin function)
router.delete('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const normalizedRoomId = roomId.toUpperCase();
    console.log('🗑️ Deleting room:', normalizedRoomId);
    
    // Delete room and all its messages
    const room = await Room.findOneAndDelete({ roomId: normalizedRoomId });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Delete all messages in the room
    await Message.deleteMany({ roomId: normalizedRoomId });

    res.json({
      success: true,
      message: 'Room and all messages deleted successfully',
      deletedRoom: {
        roomId: room.roomId,
        name: room.name,
        userCount: room.users.length,
        messageCount: room.messageCount
      }
    });

    console.log(`✅ Room deleted successfully: ${normalizedRoomId}`);
  } catch (error) {
    console.error('❌ Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update room settings
router.put('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name } = req.body;
    const normalizedRoomId = roomId.toUpperCase();

    if (name && name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Room name cannot exceed 50 characters'
      });
    }

    const room = await Room.findOneAndUpdate(
      { roomId: normalizedRoomId },
      { 
        ...(name && { name: name.trim() }),
        lastActivity: new Date()
      },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      message: 'Room updated successfully',
      room: {
        roomId: room.roomId,
        name: room.name,
        userCount: room.users.length,
        lastActivity: room.lastActivity
      }
    });

  } catch (error) {
    console.error('❌ Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update room',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;