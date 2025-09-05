// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  socketId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  currentRoom: String,
  isOnline: {
    type: Boolean,
    default: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

// Clean up users that have been offline for 1 hour
userSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('User', userSchema);