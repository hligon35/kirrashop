/**
 * Gallery routes
 */
const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/gallery');
const upload = require('../middlewares/upload');

// Gallery routes
router.get('/photos', galleryController.getPhotos);
router.get('/videos', galleryController.getVideos);
router.post('/photos', upload.single('photo'), galleryController.uploadPhoto);
router.post('/videos', upload.single('video'), galleryController.uploadVideo);
router.delete('/photos/:id', galleryController.deletePhoto);
router.delete('/videos/:id', galleryController.deleteVideo);

// Legacy gallery route for backward compatibility
router.get('/images', galleryController.getLegacyGallery);

module.exports = router;
