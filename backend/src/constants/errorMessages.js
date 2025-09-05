# File: backend/src/constants/errorMessages.js
module.exports = {
  // Room errors
  ROOM_NOT_FOUND: 'Room not found',
  ROOM_CREATION_FAILED: 'Failed to create room',
  INVALID_ROOM_ID: 'Invalid room ID format',
  ROOM_NAME_TOO_LONG: 'Room name cannot exceed 50 characters',
  
  // Message errors
  MESSAGE_REQUIRED: 'Message content is required',
  MESSAGE_TOO_LONG: 'Message cannot exceed 1000 characters',
  MESSAGE_EMPTY: 'Message content cannot be empty',
  MESSAGE_SEND_FAILED: 'Failed to send message',
  
  // User errors
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters long',
  USERNAME_TOO_LONG: 'Username cannot exceed 20 characters',
  USERNAME_INVALID_CHARS: 'Username can only contain letters, numbers, and underscores',
  USER_NOT_IN_ROOM: 'User is not in this room',
  
  // Connection errors
  CONNECTION_FAILED: 'Failed to connect to server',
  SOCKET_ERROR: 'Socket connection error',
  DATABASE_ERROR: 'Database connection error',
  
  // General errors
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  UNAUTHORIZED: 'Unauthorized access',
  BAD_REQUEST: 'Bad request'
};