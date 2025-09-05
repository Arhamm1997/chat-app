// backend/src/middleware/auth.js
// Basic authentication middleware (can be extended for JWT or session-based auth)

const auth = {
  // Basic API key authentication (optional)
  apiKey: (req, res, next) => {
    const apiKey = req.header('x-api-key');
    
    // In development, skip API key check
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or missing API key'
      });
    }
    
    next();
  },

  // Rate limiting per user (if we had user sessions)
  userRateLimit: (req, res, next) => {
    // This would implement per-user rate limiting
    // For now, we rely on the global rate limiter
    next();
  },

  // Admin routes protection
  adminOnly: (req, res, next) => {
    const adminKey = req.header('x-admin-key');
    
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    next();
  }
};

module.exports = auth;