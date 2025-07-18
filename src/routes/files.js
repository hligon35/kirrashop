/**
 * File routes
 */
const express = require('express');
const router = express.Router();
const filesController = require('../controllers/files');

// File routes
router.get('/uploads/:filename', filesController.serveUploadedFile);
router.get('/images/:filename', filesController.servePublicImage);

module.exports = router;
