/**
 * Gallery controller
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const { simulateSocialMediaPost } = require('../utils/gallery');

/**
 * Get all photos
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getPhotos(req, res) {
  res.json(db.galleryPhotos);
}

/**
 * Get all videos
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getVideos(req, res) {
  res.json(db.galleryVideos);
}

/**
 * Upload photo
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
async function uploadPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo file uploaded' });
    }

    const photo = {
      id: uuidv4(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      caption: req.body.caption || '',
      uploadedAt: new Date().toISOString(),
      socialPlatforms: JSON.parse(req.body.socialPlatforms || '[]')
    };

    db.galleryPhotos.push(photo);

    // Simulate social media posting
    if (photo.socialPlatforms.length > 0) {
      await simulateSocialMediaPost(photo, 'photo');
    }

    res.status(201).json(photo);
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
}

/**
 * Upload video
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
async function uploadVideo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const video = {
      id: uuidv4(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      caption: req.body.caption || '',
      uploadedAt: new Date().toISOString(),
      socialPlatforms: JSON.parse(req.body.socialPlatforms || '[]')
    };

    db.galleryVideos.push(video);

    // Simulate social media posting
    if (video.socialPlatforms.length > 0) {
      await simulateSocialMediaPost(video, 'video');
    }

    res.status(201).json(video);
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
}

/**
 * Delete photo
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function deletePhoto(req, res) {
  const photoIndex = db.galleryPhotos.findIndex(p => p.id === req.params.id);
  if (photoIndex !== -1) {
    const photo = db.galleryPhotos[photoIndex];
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    db.galleryPhotos.splice(photoIndex, 1);
    res.json({ message: 'Photo deleted successfully' });
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
}

/**
 * Delete video
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function deleteVideo(req, res) {
  const videoIndex = db.galleryVideos.findIndex(v => v.id === req.params.id);
  if (videoIndex !== -1) {
    const video = db.galleryVideos[videoIndex];
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, '../../uploads', video.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    db.galleryVideos.splice(videoIndex, 1);
    res.json({ message: 'Video deleted successfully' });
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
}

/**
 * Get legacy gallery images
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getLegacyGallery(req, res) {
  try {
    const files = fs.readdirSync(__dirname);
    const imageFiles = files.filter(file => 
      file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );
    res.json(imageFiles);
  } catch (error) {
    res.status(500).json({ error: 'Unable to read gallery' });
  }
}

module.exports = {
  getPhotos,
  getVideos,
  uploadPhoto,
  uploadVideo,
  deletePhoto,
  deleteVideo,
  getLegacyGallery
};
