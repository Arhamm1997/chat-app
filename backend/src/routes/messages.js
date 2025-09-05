const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Room = require('../models/Room');

// Get messages for a room
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 messages
    const skip = parseInt(req.query.skip) || 0;
    const before = req.query.before; // ISO date string for pagination

    console.log(`📨 Fetching messages for room ${roomId}, limit: ${limit}, skip: ${skip}`);

    // Validate room ID
    const normalizedRoomId = roomId.toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(normalizedRoomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room ID format'
      });
    }

    // Check if room exists
    const room = await Room.findOne({ roomId: normalizedRoomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Build query
    const query = { roomId: normalizedRoomId };
    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    // Get messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(limit)
      .skip(skip)
      .select('sender content type createdAt')
      .lean();

    // Reverse to get chronological order (oldest first)
    messages.reverse();

    const hasMore = messages.length === limit;
    const nextBefore = messages.length > 0 ? messages[0].createdAt : null;

    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        sender: {
          username: msg.sender.username,
          socketId: msg.sender.socketId
        },
        content: msg.content,
        type: msg.type,
        createdAt: msg.createdAt
      })),
      pagination: {
        limit,
        skip: skip + messages.length,
        hasMore,
        nextBefore,
        total: messages.length
      }
    });

    console.log(`✅ Sent ${messages.length} messages for room ${normalizedRoomId}`);

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get recent messages (last N messages)
router.get('/:roomId/recent', async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Max 50 recent messages

    const normalizedRoomId = roomId.toUpperCase();

    // Check if room exists
    const room = await Room.findOne({ roomId: normalizedRoomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Get recent messages
    const messages = await Message.find({ roomId: normalizedRoomId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('sender content type createdAt')
      .lean();

    // Reverse to chronological order
    messages.reverse();

    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        sender: {
          username: msg.sender.username,
          socketId: msg.sender.socketId
        },
        content: msg.content,
        type: msg.type,
        createdAt: msg.createdAt
      })),
      count: messages.length
    });

    console.log(`✅ Sent ${messages.length} recent messages for room ${normalizedRoomId}`);

  } catch (error) {
    console.error('❌ Error fetching recent messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent messages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get message statistics for a room
router.get('/:roomId/stats', async (req, res) => {
  try {
    const { roomId } = req.params;
    const normalizedRoomId = roomId.toUpperCase();

    // Check if room exists
    const room = await Room.findOne({ roomId: normalizedRoomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Get message statistics
    const totalMessages = await Message.countDocuments({ roomId: normalizedRoomId });
    
    const messagesByType = await Message.aggregate([
      { $match: { roomId: normalizedRoomId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const uniqueUsers = await Message.distinct('sender.username', { roomId: normalizedRoomId });
    
    const lastMessage = await Message.findOne({ roomId: normalizedRoomId })
      .sort({ createdAt: -1 })
      .select('createdAt sender.username')
      .lean();

    const firstMessage = await Message.findOne({ roomId: normalizedRoomId })
      .sort({ createdAt: 1 })
      .select('createdAt sender.username')
      .lean();

    // Messages per day in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentMessages = await Message.countDocuments({
      roomId: normalizedRoomId,
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        totalMessages,
        uniqueUsers: uniqueUsers.length,
        messagesByType: messagesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        messagesLast7Days: recentMessages,
        lastMessage: lastMessage ? {
          createdAt: lastMessage.createdAt,
          username: lastMessage.sender.username
        } : null,
        firstMessage: firstMessage ? {
          createdAt: firstMessage.createdAt,
          username: firstMessage.sender.username
        } : null,
        roomId: normalizedRoomId
      }
    });

  } catch (error) {
    console.error('❌ Error fetching message stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Search messages in a room
router.get('/:roomId/search', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { q: query, limit: limitParam } = req.query;
    const limit = Math.min(parseInt(limitParam) || 20, 50);
    
    const normalizedRoomId = roomId.toUpperCase();

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Check if room exists
    const room = await Room.findOne({ roomId: normalizedRoomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Search messages (case-insensitive)
    const messages = await Message.find({
      roomId: normalizedRoomId,
      content: { $regex: query.trim(), $options: 'i' },
      type: 'message' // Only search user messages, not system messages
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('sender content createdAt')
      .lean();

    res.json({
      success: true,
      query: query.trim(),
      results: messages.map(msg => ({
        id: msg._id,
        sender: {
          username: msg.sender.username
        },
        content: msg.content,
        createdAt: msg.createdAt
      })),
      count: messages.length
    });

  } catch (error) {
    console.error('❌ Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete old messages (cleanup endpoint)
router.delete('/:roomId/cleanup', async (req, res) => {
  try {
    const { roomId } = req.params;
    const daysOld = parseInt(req.query.days) || 30; // Default 30 days
    const normalizedRoomId = roomId.toUpperCase();

    // Check if room exists
    const room = await Room.findOne({ roomId: normalizedRoomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));

    const result = await Message.deleteMany({
      roomId: normalizedRoomId,
      createdAt: { $lt: cutoffDate }
    });

    // Update room message count
    const remainingMessages = await Message.countDocuments({ roomId: normalizedRoomId });
    await Room.findOneAndUpdate(
      { roomId: normalizedRoomId },
      { messageCount: remainingMessages }
    );

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} messages older than ${daysOld} days`,
      deletedCount: result.deletedCount,
      remainingMessages,
      cutoffDate
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} messages from room ${normalizedRoomId}`);

  } catch (error) {
    console.error('❌ Error cleaning up messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup messages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get system messages only
router.get('/:roomId/system', async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const normalizedRoomId = roomId.toUpperCase();

    // Check if room exists
    const room = await Room.findOne({ roomId: normalizedRoomId });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const systemMessages = await Message.find({
      roomId: normalizedRoomId,
      type: 'system'
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('content createdAt')
      .lean();

    systemMessages.reverse(); // Chronological order

    res.json({
      success: true,
      messages: systemMessages.map(msg => ({
        id: msg._id,
        content: msg.content,
        type: 'system',
        createdAt: msg.createdAt
      })),
      count: systemMessages.length
    });

  } catch (error) {
    console.error('❌ Error fetching system messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system messages',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;