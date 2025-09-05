// backend/src/utils/validation.js
const validation = {
  // Room ID validation
  validateRoomId: (roomId) => {
    if (!roomId) {
      return { isValid: false, error: 'Room ID is required' };
    }
    
    if (typeof roomId !== 'string') {
      return { isValid: false, error: 'Room ID must be a string' };
    }
    
    if (roomId.length !== 6) {
      return { isValid: false, error: 'Room ID must be exactly 6 characters long' };
    }
    
    if (!/^[A-Z0-9]{6}$/.test(roomId)) {
      return { isValid: false, error: 'Room ID must contain only uppercase letters and numbers' };
    }
    
    return { isValid: true };
  },

  // Username validation
  validateUsername: (username) => {
    if (!username) {
      return { isValid: false, error: 'Username is required' };
    }
    
    if (typeof username !== 'string') {
      return { isValid: false, error: 'Username must be a string' };
    }
    
    const trimmed = username.trim();
    
    if (trimmed.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters long' };
    }
    
    if (trimmed.length > 20) {
      return { isValid: false, error: 'Username cannot exceed 20 characters' };
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    
    // Check for inappropriate words (basic filter)
    const inappropriateWords = ['admin', 'system', 'bot', 'moderator', 'null', 'undefined'];
    if (inappropriateWords.some(word => trimmed.toLowerCase().includes(word))) {
      return { isValid: false, error: 'Username contains inappropriate words' };
    }
    
    return { isValid: true };
  },

  // Message content validation
  validateMessageContent: (content) => {
    if (!content) {
      return { isValid: false, error: 'Message content is required' };
    }
    
    if (typeof content !== 'string') {
      return { isValid: false, error: 'Message content must be a string' };
    }
    
    const trimmed = content.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Message content cannot be empty' };
    }
    
    if (trimmed.length > 1000) {
      return { isValid: false, error: 'Message content cannot exceed 1000 characters' };
    }
    
    // Basic spam detection
    const repeatedChars = /(.)\1{10,}/; // More than 10 repeated characters
    if (repeatedChars.test(trimmed)) {
      return { isValid: false, error: 'Message contains too many repeated characters' };
    }
    
    return { isValid: true };
  },

  // Room name validation
  validateRoomName: (name) => {
    if (!name) {
      return { isValid: true }; // Room name is optional
    }
    
    if (typeof name !== 'string') {
      return { isValid: false, error: 'Room name must be a string' };
    }
    
    const trimmed = name.trim();
    
    if (trimmed.length > 50) {
      return { isValid: false, error: 'Room name cannot exceed 50 characters' };
    }
    
    return { isValid: true };
  },

  // Email validation (if needed for future features)
  validateEmail: (email) => {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }
    
    return { isValid: true };
  }
};

module.exports = validation;