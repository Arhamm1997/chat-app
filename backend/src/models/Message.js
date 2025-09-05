// src/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    username: { type: String, required: true },
    socketId: String
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['message', 'system'],
    default: 'message'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying of recent messages
messageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);