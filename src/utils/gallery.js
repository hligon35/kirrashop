/**
 * Gallery utility functions
 */
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

/**
 * Initialize gallery with existing images
 */
function initializeGallery() {
  try {
    const imagesDir = path.join(__dirname, '../../public/images');
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      const imageFiles = files.filter(file => 
        file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
      );
      
      imageFiles.forEach(filename => {
        const photo = {
          id: uuidv4(),
          filename: filename,
          originalName: filename,
          url: `/images/${filename}`,
          caption: `Nail art showcase - ${filename.split('.')[0]}`,
          uploadedAt: new Date().toISOString(),
          socialPlatforms: ['instagram']
        };
        db.galleryPhotos.push(photo);
      });
      
      console.log(`📸 Initialized gallery with ${db.galleryPhotos.length} photos`);
    }
  } catch (error) {
    console.error('Error initializing gallery:', error);
  }
}

/**
 * Simulate social media posting
 * In production, this would be replaced with actual social media APIs
 * @param {Object} media Media object
 * @param {string} type Media type ('photo' or 'video')
 * @returns {Promise<void>}
 */
async function simulateSocialMediaPost(media, type) {
  console.log(`📱 Simulating ${type} post to social media platforms:`);
  
  for (const platform of media.socialPlatforms) {
    console.log(`  ✅ Posted to ${platform.toUpperCase()}: "${media.caption}"`);
    
    // Simulate different platform-specific behaviors
    switch (platform) {
      case 'instagram':
        console.log(`    📸 Instagram: Added to story and feed`);
        break;
      case 'tiktok':
        console.log(`    🎵 TikTok: Added trending hashtags #nailart #nailsalon`);
        break;
      case 'facebook':
        console.log(`    👥 Facebook: Posted to business page`);
        break;
      case 'twitter':
        console.log(`    🐦 X (Twitter): Added relevant hashtags`);
        break;
      case 'snapchat':
        console.log(`    👻 Snapchat: Added to story with location`);
        break;
    }
  }
}

module.exports = {
  initializeGallery,
  simulateSocialMediaPost
};
