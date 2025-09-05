const Room = require('../../models/Room');
const Message = require('../../models/Message');

const roomManager = {
  // Get room statistics
  getRoomStats: async (roomId) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return null;

      const messageCount = await Message.countDocuments({ roomId });
      const recentMessages = await Message.find({ roomId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('sender createdAt');

      return {
        roomId: room.roomId,
        name: room.name,
        userCount: room.users.length,
        messageCount,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity,
        onlineUsers: room.users.map(u => u.username),
        recentActivity: recentMessages
      };
    } catch (error) {
      console.error('Error getting room stats:', error);
      return null;
    }
  },

  // Clean inactive users from rooms
  cleanInactiveUsers: async () => {
    try {
      const cutoffTime = new Date(Date.now() - (30 * 60 * 1000)); // 30 minutes ago
      
      const result = await Room.updateMany(
        {},
        {
          $pull: {
            users: {
              lastSeen: { $lt: cutoffTime }
            }
          }
        }
      );

      console.log(`🧹 Cleaned inactive users from ${result.modifiedCount} rooms`);
      return result.modifiedCount;
    } catch (error) {
      console.error('Error cleaning inactive users:', error);
      return 0;
    }
  },

  // Get active rooms
  getActiveRooms: async () => {
    try {
      const rooms = await Room.find({
        'users.0': { $exists: true }, // Has at least one user
        lastActivity: { $gte: new Date(Date.now() - (24 * 60 * 60 * 1000)) } // Active in last 24 hours
      })
      .select('roomId name users.length messageCount lastActivity')
      .sort({ lastActivity: -1 });

      return rooms.map(room => ({
        roomId: room.roomId,
        name: room.name,
        userCount: room.users.length,
        messageCount: room.messageCount,
        lastActivity: room.lastActivity
      }));
    } catch (error) {
      console.error('Error getting active rooms:', error);
      return [];
    }
  }
};

module.exports = roomManager;
