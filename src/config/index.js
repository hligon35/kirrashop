/**
 * Configuration settings for Kirra's Nail Studio application
 */
module.exports = {
  PORT: process.env.PORT || 3000,
  FILE_SIZE_LIMIT: 50 * 1024 * 1024, // 50MB file size limit
  SESSION_EXPIRY: 30 * 60 * 1000, // 30 minutes
  VERIFICATION_EXPIRY: 10 * 60 * 1000, // 10 minutes
  EXTENDED_SESSION_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  ALLOWED_FILE_TYPES: /jpeg|jpg|png|gif|webp|mp4|avi|mov|wmv|flv/,
  MAX_VERIFICATION_ATTEMPTS: 3,
  UPLOADS_DIR: 'uploads',
  PUBLIC_DIR: 'public',
  IMAGES_DIR: 'public/images'
};
