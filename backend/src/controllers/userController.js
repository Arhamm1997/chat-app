/ backend/src/controllers/userController.js
const User = require('../models/User');
const Room = require('../models/Room');

const userController = {
  // Get online users in a room
  getRoomUsers: async (req, res) => {
    try {
      const { roomId } = req.params;

      const room = await Room.findOne({ roomId }).select('users');
      
      if (!room) {
        return res.status(404).json({
          success: false,
          message: 'Room not found'
        });
      }

      const onlineUsers = room.users.map(user => ({
        username: user.username,
        joinedAt: user.joinedAt,
        isOnline: true,
        isTyping: user.isTyping || false
      }));

      res.json({
        success: true,
        users: onlineUsers,
        count: onlineUsers.length
      });
    } catch (error) {
      console.error('Error fetching room users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch room users'
      });
    }
  },

  // Get user statistics
  getUserStats: async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const onlineUsers = await User.countDocuments({ isOnline: true });
      
      // Users by room
      const usersByRoom = await Room.aggregate([
        { $unwind: '$users' },
        {
          $group: {
            _id: '$roomId',
            userCount: { $sum: 1 },
            roomName: { $first: '$name' }
          }
        },
        { $sort: { userCount: -1 } },
        { $limit: 10 }
      ]);

      res.json({
        success: true,
        stats: {
          totalUsers,
          onlineUsers,
          offlineUsers: totalUsers - onlineUsers,
          topRooms: usersByRoom
        }
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user statistics'
      });
    }
  }
};

module.exports = userController;