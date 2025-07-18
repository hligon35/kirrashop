/**
 * Authentication routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

// Server status endpoint for debugging
router.get('/status', authController.getStatus);

// Authentication API Routes
router.post('/login', authController.login);
router.post('/verify', authController.verify);
router.post('/resend', authController.resendCode);
router.post('/verify-token', authController.verifyToken);
router.post('/logout', authController.logout);

module.exports = router;
