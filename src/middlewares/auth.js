/**
 * Authentication middleware
 */
const db = require('../models');

/**
 * Middleware to require authentication for protected routes
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  const session = db.activeSessions.get(token);
  
  if (!session || session.expiry < Date.now() || !session.verified) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  req.userPhone = session.phone;
  next();
}

module.exports = {
  requireAuth
};
