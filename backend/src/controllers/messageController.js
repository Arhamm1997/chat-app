/ backend/src/controllers/messageController.js
const Message = require('../models/Message');
const Room = require('../models/Room');
const { validateMessage } = require('../utils/validation');

const messageController = {
  // Get messages for a room
  getRoomMessages: async (req, res) => {
    try {
      const { roomId } = req.params;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 messages
      const skip = parseInt(req.query.skip) || 0;
      const before = req.query.before; // ISO date string for pagination

      // Check if room exists
      const room = await Room.findOne({ roomId });
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      // Build query
      const query = { roomId };
      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      // Get messages
      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .select('sender content type createdAt')
        .lean();

      // Reverse to get chronological order
      messages.reverse();

      res.json({
        success: true,
        messages: messages.map(msg => ({
          id: msg._id,
          sender: msg.sender,
          content: msg.content,
          type: msg.type,
          createdAt: msg.createdAt
        })),
        hasMore: messages.length === limit,
        pagination: {
          limit,
          skip: skip + messages.length,
          before: messages.length > 0 ? messages[0].createdAt : null
        }
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch messages'
      });
    }
  },

  // Get message statistics
  getMessageStats: async (req, res) => {
    try {
      const { roomId } = req.params;

      const stats = await Message.aggregate([
        { $match: { roomId } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            avgLength: { $avg: { $strLenCP: '$content' } }
          }
        }
      ]);

      const totalMessages = await Message.countDocuments({ roomId });
      const uniqueUsers = await Message.distinct('sender.username', { roomId });

      res.json({
        success: true,
        stats: {
          totalMessages,
          uniqueUsers: uniqueUsers.length,
          messageTypes: stats,
          roomId
        }
      });
    } catch (error) {
      console.error('Error fetching message stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch message statistics'
      });
    }
  },

  // Delete old messages (cleanup job)
  cleanupMessages: async (req, res) => {
    try {
      const daysAgo = parseInt(req.query.days) || 30; // Default 30 days
      const cutoffTime = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000));

      const result = await Message.deleteMany({
        createdAt: { $lt: cutoffTime }
      });

      res.json({
        success: true,
        message: `Deleted ${result.deletedCount} old messages`,
        deletedCount: result.deletedCount,
        cutoffDate: cutoffTime
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} messages older than ${daysAgo} days`);
    } catch (error) {
      console.error('Error cleaning up messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup messages'
      });
    }
  }
};

module.exports = messageController;