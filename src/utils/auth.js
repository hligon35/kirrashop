/**
 * Authentication utility functions
 */
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a 6-digit verification code
 * @returns {string} Verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a unique session token
 * @returns {string} Session token
 */
function generateSessionToken() {
  return uuidv4() + '-' + Date.now();
}

/**
 * Mask a phone number for display
 * @param {string} phone Phone number to mask
 * @returns {string} Masked phone number
 */
function maskPhone(phone) {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-****');
}

/**
 * Simulate sending an SMS
 * In production, this would be replaced with an actual SMS service
 * @param {string} phone Phone number to send to
 * @param {string} message Message to send
 * @returns {Promise<boolean>} Success status
 */
function sendSMS(phone, message) {
  // SMS simulation - in production, integrate with Twilio, AWS SNS, etc.
  console.log(`\n🔐 ====== VERIFICATION CODE ======`);
  console.log(`📱 SMS to ${phone}: ${message}`);
  console.log(`🔑 VERIFICATION CODE FOR TESTING: ${message.match(/\d{6}/)?.[0] || 'Not found'}`);
  console.log(`🚨 ================================\n`);
  
  // For testing: also log just the code clearly
  const code = message.match(/\d{6}/)?.[0];
  if (code) {
    console.log(`*** ENTER THIS CODE: ${code} ***`);
  }
  
  // Simulate SMS delay
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ SMS delivered to ${phone}`);
      resolve(true);
    }, 1000);
  });
}

module.exports = {
  generateVerificationCode,
  generateSessionToken,
  maskPhone,
  sendSMS
};
