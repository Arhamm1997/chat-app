
// backend/src/middleware/validation.js
const validateRoomId = (req, res, next) => {
  const { roomId } = req.params;
  
  if (!roomId || typeof roomId !== 'string' || roomId.length !== 6) {
    return res.status(400).json({
      success: false,
      message: 'Invalid room ID format'
    });
  }
  
  if (!/^[A-Z0-9]{6}$/.test(roomId)) {
    return res.status(400).json({
      success: false,
      message: 'Room ID must be 6 characters long and contain only letters and numbers'
    });
  }
  
  next();
};

const validateMessage = (req, res, next) => {
  const { content } = req.body;
  
  if (!content || typeof content !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Message content is required'
    });
  }
  
  if (content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Message content cannot be empty'
    });
  }
  
  if (content.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Message content cannot exceed 1000 characters'
    });
  }
  
  next();
};

const validateRoomName = (req, res, next) => {
  const { name } = req.body;
  
  if (name && typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Room name must be a string'
    });
  }
  
  if (name && name.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Room name cannot exceed 50 characters'
    });
  }
  
  next();
};

module.exports = {
  validateRoomId,
  validateMessage,
  validateRoomName
};
