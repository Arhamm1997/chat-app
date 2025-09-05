const Room = require('../models/Room');
const Message = require('../models/Message');
const { generateRoomId } = require('../utils/generateId');
const { validateRoomName } = require('../utils/validation');

const roomController = {
  // Create a new room
  createRoom: async (req, res) => {
    try {
      const { name } = req.body;
      
      // Validate room name
      const validation = validateRoomName(name);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }

      const roomId = generateRoomId();
      
      const room = new Room({
        roomId,
        name: name || 'Anonymous Chat Room',
        createdAt: new Date()
      });

      await room.save();

      res.status(201).json({
        success: true,
        roomId: room.roomId,
        message: 'Room created successfully'
      });

      console.log(`🏠 Room created: ${roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create room'
      });
    }
  },

  // Get room information
  getRoomInfo: async (req, res) => {
    try {
      const { roomId } = req.params;
      
      const room = await Room.findOne({ roomId });
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      res.json({
        success: true,
        room: {
          roomId: room.roomId,
          name: room.name,
          userCount: room.users.length,
          messageCount: room.messageCount,
          createdAt: room.createdAt,
          lastActivity: room.lastActivity
        }
      });
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch room information'
      });
    }
  },

  // Check if room exists
  checkRoomExists: async (req, res) => {
    try {
      const { roomId } = req.params;
      const room = await Room.findOne({ roomId });
      
      res.json({
        success: true,
        exists: !!room,
        ...(room && {
          room: {
            name: room.name,
            userCount: room.users.length,
            lastActivity: room.lastActivity
          }
        })
      });
    } catch (error) {
      console.error('Error checking room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check room'
      });
    }
  },

  // Get all rooms (for admin/debug purposes)
  getAllRooms: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const rooms = await Room.find()
        .select('roomId name userCount messageCount createdAt lastActivity')
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Room.countDocuments();

      res.json({
        success: true,
        rooms,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch rooms'
      });
    }
  },

  // Delete inactive rooms (cleanup job)
  cleanupRooms: async (req, res) => {
    try {
      const hoursAgo = 24; // Delete rooms inactive for 24 hours
      const cutoffTime = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000));

      const result = await Room.deleteMany({
        lastActivity: { $lt: cutoffTime },
        'users.0': { $exists: false } // Only delete rooms with no users
      });

      res.json({
        success: true,
        message: `Deleted ${result.deletedCount} inactive rooms`,
        deletedCount: result.deletedCount
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} inactive rooms`);
    } catch (error) {
      console.error('Error cleaning up rooms:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup rooms'
      });
    }
  }
};

module.exports = roomController;
