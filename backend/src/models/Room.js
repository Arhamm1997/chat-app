// src/models/Room.js
const mongoose = require('mongoose');

// User schema for users in room
const UserInRoomSchema = new mongoose.Schema({
  socketId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isTyping: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['online', 'away', 'busy'],
    default: 'online'
  }
}, { _id: false }); // Don't create separate _id for subdocuments

// Main Room schema
const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: /^[A-Z0-9]{6}$/,
    index: true
  },
  name: {
    type: String,
    default: 'Anonymous Chat Room',
    trim: true,
    maxlength: 50
  },
  users: {
    type: [UserInRoomSchema],
    default: [],
    validate: {
      validator: function(users) {
        return users.length <= 100; // Maximum 100 users per room
      },
      message: 'Room cannot have more than 100 users'
    }
  },
  messageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: null
  },
  maxUsers: {
    type: Number,
    default: 100,
    min: 1,
    max: 500
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowAnonymous: {
      type: Boolean,
      default: true
    },
    allowFileSharing: {
      type: Boolean,
      default: false
    },
    messageHistory: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null // Set if you want rooms to expire
  }
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
  versionKey: false // Remove __v version key
});

// Indexes for better performance
RoomSchema.index({ roomId: 1 }, { unique: true });
RoomSchema.index({ lastActivity: -1 });
RoomSchema.index({ createdAt: -1 });
RoomSchema.index({ isActive: 1, lastActivity: -1 });

// Virtual for user count
RoomSchema.virtual('userCount').get(function() {
  return this.users.length;
});

// Instance methods
RoomSchema.methods.addUser = function(userData) {
  // Check if user already exists
  const existingUserIndex = this.users.findIndex(
    user => user.socketId === userData.socketId
  );
  
  if (existingUserIndex !== -1) {
    // Update existing user
    this.users[existingUserIndex] = {
      ...this.users[existingUserIndex].toObject(),
      ...userData,
      lastSeen: new Date()
    };
  } else {
    // Add new user
    this.users.push({
      ...userData,
      joinedAt: new Date(),
      lastSeen: new Date()
    });
  }
  
  this.lastActivity = new Date();
  return this.save();
};

RoomSchema.methods.removeUser = function(socketId) {
  this.users = this.users.filter(user => user.socketId !== socketId);
  this.lastActivity = new Date();
  return this.save();
};

RoomSchema.methods.updateUserActivity = function(socketId) {
  const user = this.users.find(user => user.socketId === socketId);
  if (user) {
    user.lastSeen = new Date();
    this.lastActivity = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

RoomSchema.methods.setUserTyping = function(socketId, isTyping) {
  const user = this.users.find(user => user.socketId === socketId);
  if (user) {
    user.isTyping = isTyping;
    user.lastSeen = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
RoomSchema.statics.findActiveRooms = function() {
  return this.find({ 
    isActive: true,
    lastActivity: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).sort({ lastActivity: -1 });
};

RoomSchema.statics.findByRoomId = function(roomId) {
  return this.findOne({ roomId: roomId.toUpperCase() });
};

RoomSchema.statics.createRoom = function(roomData) {
  return this.create({
    roomId: roomData.roomId.toUpperCase(),
    name: roomData.name || 'Anonymous Chat Room',
    createdAt: new Date(),
    lastActivity: new Date(),
    ...roomData
  });
};

// Pre-save middleware
RoomSchema.pre('save', function(next) {
  // Ensure roomId is always uppercase
  if (this.roomId) {
    this.roomId = this.roomId.toUpperCase();
  }
  
  // Update lastActivity
  if (this.isModified('users') || this.isModified('messageCount')) {
    this.lastActivity = new Date();
  }
  
  // Clean up inactive users (older than 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  this.users = this.users.filter(user => user.lastSeen > oneHourAgo);
  
  next();
});

// Post-save middleware for logging
RoomSchema.post('save', function(doc) {
  console.log(`📦 Room saved: ${doc.roomId} with ${doc.users.length} users`);
});

// TTL index for auto-deletion of expired rooms (if expiresAt is set)
RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for complex queries
RoomSchema.index({ isActive: 1, userCount: -1, lastActivity: -1 });

module.exports = mongoose.model('Room', RoomSchema);