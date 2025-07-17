const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|wmv|flv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed!'));
    }
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// In-memory storage (replace with database in production)
let appointments = [];
let customers = [];
let finances = { revenue: 0, expenses: 0, balance: 0 };
let promoCodes = [];
let communications = [];
let galleryPhotos = [];
let galleryVideos = [];

// Authentication storage
let users = [
  {
    id: 'admin',
    phone: '5551234567', // Default admin phone: (555) 123-4567
    password: 'Admin123!',  // Default admin password - contains uppercase and special character
    name: 'Kirra Admin',
    role: 'admin'
  }
];
let activeSessions = new Map(); // sessionToken -> {phone, expiry, verified}
let verificationCodes = new Map(); // phone -> {code, expiry, attempts}

// Initialize gallery with existing images
function initializeGallery() {
  try {
    const imagesDir = path.join(__dirname, 'public', 'images');
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
        galleryPhotos.push(photo);
      });
      
      console.log(`📸 Initialized gallery with ${galleryPhotos.length} photos`);
    }
  } catch (error) {
    console.error('Error initializing gallery:', error);
  }
}

// Call initialization
initializeGallery();

// Authentication helper functions
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSessionToken() {
  return uuidv4() + '-' + Date.now();
}

function sendSMS(phone, message) {
  // SMS simulation - in production, integrate with Twilio, AWS SNS, etc.
  console.log(`📱 SMS to ${phone}: ${message}`);
  
  // Simulate SMS delay
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ SMS delivered to ${phone}`);
      resolve(true);
    }, 1000);
  });
}

function maskPhone(phone) {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-****');
}

// Authentication middleware
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  const session = activeSessions.get(token);
  
  if (!session || session.expiry < Date.now() || !session.verified) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  req.userPhone = session.phone;
  next();
}

// Authentication API Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone and password are required' });
    }
    
    // Find user
    const user = users.find(u => u.phone === phone);
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid phone number or password' });
    }
    
    // Generate verification code
    const code = generateVerificationCode();
    const sessionToken = generateSessionToken();
    
    // Store verification code (expires in 10 minutes)
    verificationCodes.set(phone, {
      code,
      expiry: Date.now() + 10 * 60 * 1000,
      attempts: 0
    });
    
    // Create session (unverified)
    activeSessions.set(sessionToken, {
      phone,
      expiry: Date.now() + 30 * 60 * 1000, // 30 minutes
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
});

app.post('/api/auth/verify', (req, res) => {
  try {
    const { phone, code, sessionToken } = req.body;
    
    if (!phone || !code || !sessionToken) {
      return res.status(400).json({ message: 'Phone, code, and session token are required' });
    }
    
    // Check session
    const session = activeSessions.get(sessionToken);
    if (!session || session.phone !== phone || session.expiry < Date.now()) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }
    
    // Check verification code
    const verification = verificationCodes.get(phone);
    if (!verification || verification.expiry < Date.now()) {
      return res.status(401).json({ message: 'Verification code expired' });
    }
    
    if (verification.attempts >= 3) {
      verificationCodes.delete(phone);
      activeSessions.delete(sessionToken);
      return res.status(429).json({ message: 'Too many attempts. Please login again.' });
    }
    
    if (verification.code !== code) {
      verification.attempts++;
      return res.status(401).json({ 
        message: 'Invalid verification code',
        attemptsRemaining: 3 - verification.attempts
      });
    }
    
    // Verification successful
    session.verified = true;
    session.expiry = Date.now() + 24 * 60 * 60 * 1000; // Extend to 24 hours
    
    // Clean up verification code
    verificationCodes.delete(phone);
    
    // Generate auth token (same as session token for simplicity)
    const authToken = sessionToken;
    
    res.json({
      message: 'Login successful',
      authToken,
      user: {
        phone: maskPhone(phone),
        name: users.find(u => u.phone === phone)?.name
      }
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/resend', async (req, res) => {
  try {
    const { phone, sessionToken } = req.body;
    
    // Check session
    const session = activeSessions.get(sessionToken);
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
    
    verificationCodes.set(phone, {
      code,
      expiry: Date.now() + 10 * 60 * 1000,
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
});

app.post('/api/auth/verify-token', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ valid: false });
    }
    
    const token = authHeader.substring(7);
    const session = activeSessions.get(token);
    
    if (!session || session.expiry < Date.now() || !session.verified) {
      return res.json({ valid: false });
    }
    
    res.json({ valid: true });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.json({ valid: false });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      activeSessions.delete(token);
    }
    
    res.json({ message: 'Logged out successfully' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API Routes

// Appointments
app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

app.post('/api/appointments', (req, res) => {
  const appointment = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  appointments.push(appointment);
  res.status(201).json(appointment);
});

app.put('/api/appointments/:id', (req, res) => {
  const index = appointments.findIndex(apt => apt.id === req.params.id);
  if (index !== -1) {
    appointments[index] = { ...appointments[index], ...req.body };
    res.json(appointments[index]);
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
});

app.delete('/api/appointments/:id', (req, res) => {
  const index = appointments.findIndex(apt => apt.id === req.params.id);
  if (index !== -1) {
    appointments.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
});

// Customers
app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.post('/api/customers', (req, res) => {
  const customer = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  customers.push(customer);
  res.status(201).json(customer);
});

// Finances
app.get('/api/finances', (req, res) => {
  res.json(finances);
});

app.post('/api/finances/transaction', (req, res) => {
  const { type, amount, description } = req.body;
  if (type === 'revenue') {
    finances.revenue += amount;
    finances.balance += amount;
  } else if (type === 'expense') {
    finances.expenses += amount;
    finances.balance -= amount;
  }
  res.json(finances);
});

// Promo Codes
app.get('/api/promo-codes', (req, res) => {
  res.json(promoCodes);
});

app.post('/api/promo-codes', (req, res) => {
  const promoCode = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    used: 0
  };
  promoCodes.push(promoCode);
  res.status(201).json(promoCode);
});

// Communications
app.get('/api/communications', (req, res) => {
  res.json(communications);
});

app.post('/api/communications', (req, res) => {
  const communication = {
    id: uuidv4(),
    ...req.body,
    timestamp: new Date().toISOString()
  };
  communications.push(communication);
  res.status(201).json(communication);
});

// Enhanced Gallery Routes

// Get photos
app.get('/api/gallery/photos', (req, res) => {
  res.json(galleryPhotos);
});

// Get videos
app.get('/api/gallery/videos', (req, res) => {
  res.json(galleryVideos);
});

// Upload photo
app.post('/api/gallery/photos', upload.single('photo'), async (req, res) => {
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

    galleryPhotos.push(photo);

    // Simulate social media posting
    if (photo.socialPlatforms.length > 0) {
      await simulateSocialMediaPost(photo, 'photo');
    }

    res.status(201).json(photo);
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Upload video
app.post('/api/gallery/videos', upload.single('video'), async (req, res) => {
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

    galleryVideos.push(video);

    // Simulate social media posting
    if (video.socialPlatforms.length > 0) {
      await simulateSocialMediaPost(video, 'video');
    }

    res.status(201).json(video);
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Delete photo
app.delete('/api/gallery/photos/:id', (req, res) => {
  const photoIndex = galleryPhotos.findIndex(p => p.id === req.params.id);
  if (photoIndex !== -1) {
    const photo = galleryPhotos[photoIndex];
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, 'uploads', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    galleryPhotos.splice(photoIndex, 1);
    res.json({ message: 'Photo deleted successfully' });
  } else {
    res.status(404).json({ error: 'Photo not found' });
  }
});

// Delete video
app.delete('/api/gallery/videos/:id', (req, res) => {
  const videoIndex = galleryVideos.findIndex(v => v.id === req.params.id);
  if (videoIndex !== -1) {
    const video = galleryVideos[videoIndex];
    
    // Delete file from filesystem
    const filePath = path.join(__dirname, 'uploads', video.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    galleryVideos.splice(videoIndex, 1);
    res.json({ message: 'Video deleted successfully' });
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
});

// Simulate social media posting (in production, integrate with actual APIs)
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

// Legacy gallery route for backward compatibility
app.get('/api/gallery/images', (req, res) => {
  try {
    const files = fs.readdirSync(__dirname);
    const imageFiles = files.filter(file => 
      file.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)
    );
    res.json(imageFiles);
  } catch (error) {
    res.status(500).json({ error: 'Unable to read gallery' });
  }
});

// Serve uploaded images and videos
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Serve existing images from public/images directory
app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'images', filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// Serve main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Kirra's Nail Studio API running on port ${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}`);
});
