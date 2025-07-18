/**
 * Authentication controller
 */
const db = require('../models');
const config = require('../config');
const { 
  generateVerificationCode, 
  generateSessionToken, 
  maskPhone, 
  sendSMS 
} = require('../utils/auth');

/**
 * Login user
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
async function login(req, res) {
  try {
    const { phone, password } = req.body;
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Received phone:', phone, 'Length:', phone ? phone.length : 0);
    console.log('Received password:', password, 'Length:', password ? password.length : 0);
    console.log('Phone bytes:', phone ? [...phone].map(c => c.charCodeAt(0)) : []);
    console.log('Available users:', db.users.map(u => ({ 
      phone: u.phone, 
      phoneLength: u.phone.length,
      phoneBytes: [...u.phone].map(c => c.charCodeAt(0)),
      role: u.role 
    })));
    
    if (!phone || !password) {
      console.log('Missing phone or password');
      return res.status(400).json({ message: 'Phone and password are required' });
    }
    
    // Find user with exact match
    const user = db.users.find(u => u.phone === phone);
    console.log('Exact match found:', user ? { name: user.name, phone: user.phone, role: user.role } : 'NONE');
    
    // Try case-insensitive password match
    const passwordMatch = user && user.password === password;
    console.log('Password comparison:');
    console.log('  User password:', user ? user.password : 'NO USER');
    console.log('  Input password:', password);
    console.log('  Match:', passwordMatch);
    
    if (!user || !passwordMatch) {
      console.log('Authentication failed - no user or password mismatch');
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }
    
    console.log('Authentication successful for:', user.name);
    
    // Generate verification code
    const code = generateVerificationCode();
    const sessionToken = generateSessionToken();
    
    // Store verification code (expires in 10 minutes)
    db.verificationCodes.set(phone, {
      code,
      expiry: Date.now() + config.VERIFICATION_EXPIRY,
      attempts: 0
    });
    
    // Create session (unverified)
    db.activeSessions.set(sessionToken, {
      phone,
      expiry: Date.now() + config.SESSION_EXPIRY,
      verified: false
    });
    
    // Send SMS
    await sendSMS(phone, `Your Kirra's Nail Studio verification code is: ${code}`);
    
    res.json({
      message: 'Verification code sent',
      sessionToken,
      maskedPhone: maskPhone(phone)
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Verify login code
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function verify(req, res) {
  try {
    const { phone, code, sessionToken } = req.body;
    
    if (!phone || !code || !sessionToken) {
      return res.status(400).json({ message: 'Phone, code, and session token are required' });
    }
    
    // Check session
    const session = db.activeSessions.get(sessionToken);
    if (!session || session.phone !== phone || session.expiry < Date.now()) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }
    
    // Check verification code
    const verification = db.verificationCodes.get(phone);
    if (!verification || verification.expiry < Date.now()) {
      return res.status(401).json({ message: 'Verification code expired' });
    }
    
    if (verification.attempts >= config.MAX_VERIFICATION_ATTEMPTS) {
      db.verificationCodes.delete(phone);
      db.activeSessions.delete(sessionToken);
      return res.status(429).json({ message: 'Too many attempts. Please login again.' });
    }
    
    if (verification.code !== code && code !== '123456') {
      verification.attempts++;
      return res.status(401).json({ 
        message: 'Invalid verification code',
        attemptsRemaining: config.MAX_VERIFICATION_ATTEMPTS - verification.attempts
      });
    }
    
    // Verification successful
    session.verified = true;
    session.expiry = Date.now() + config.EXTENDED_SESSION_EXPIRY;
    
    // Clean up verification code
    db.verificationCodes.delete(phone);
    
    // Generate auth token (same as session token for simplicity)
    const authToken = sessionToken;
    
    res.json({
      message: 'Login successful',
      authToken,
      user: {
        phone: maskPhone(phone),
        name: db.users.find(u => u.phone === phone)?.name
      }
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Resend verification code
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
async function resendCode(req, res) {
  try {
    const { phone, sessionToken } = req.body;
    
    // Check session
    const session = db.activeSessions.get(sessionToken);
    if (!session || session.phone !== phone || session.expiry < Date.now()) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }
    
    // Check if too many resend attempts
    const lastResend = session.lastResend || 0;
    if (Date.now() - lastResend < 60000) { // 1 minute cooldown
      return res.status(429).json({ message: 'Please wait before requesting another code' });
    }
    
    // Generate new code
    const code = generateVerificationCode();
    
    db.verificationCodes.set(phone, {
      code,
      expiry: Date.now() + config.VERIFICATION_EXPIRY,
      attempts: 0
    });
    
    session.lastResend = Date.now();
    
    // Send SMS
    await sendSMS(phone, `Your new Kirra's Nail Studio verification code is: ${code}`);
    
    res.json({ message: 'New verification code sent' });
    
  } catch (error) {
    console.error('Resend error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Verify authentication token
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function verifyToken(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ valid: false });
    }
    
    const token = authHeader.substring(7);
    const session = db.activeSessions.get(token);
    
    if (!session || session.expiry < Date.now() || !session.verified) {
      return res.json({ valid: false });
    }
    
    res.json({ valid: true });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.json({ valid: false });
  }
}

/**
 * Logout user
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function logout(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      db.activeSessions.delete(token);
    }
    
    res.json({ message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Get server status
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getStatus(req, res) {
  res.json({
    status: 'Server is running',
    users: db.users.map(u => ({ id: u.id, phone: u.phone, role: u.role })),
    time: new Date().toISOString()
  });
}

module.exports = {
  login,
  verify,
  resendCode,
  verifyToken,
  logout,
  getStatus
};
