/**
 * File handling controller
 */
const fs = require('fs');
const path = require('path');

/**
 * Serve uploaded file
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function serveUploadedFile(req, res) {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads', filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
}

/**
 * Serve public image
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function servePublicImage(req, res) {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../public/images', filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
}

module.exports = {
  serveUploadedFile,
  servePublicImage
};
