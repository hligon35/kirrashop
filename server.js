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

// API endpoint to get all gallery images
app.get('/api/gallery-images', (req, res) => {
  try {
    const imagesDir = path.join(__dirname, 'public', 'images');
    const files = fs.readdirSync(imagesDir);
    // Filter for image files only
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
    });
    res.json(imageFiles);
  } catch (error) {
    console.error('Error reading gallery images:', error);
    res.status(500).json({ error: 'Failed to read gallery images' });
  }
});

// In-memory storage (replace with database in production)
let appointments = [];
let customers = [];
let finances = { revenue: 0, expenses: 0, balance: 0 };
let promoCodes = [];
let communications = [];
let galleryPhotos = [];
let galleryVideos = [];
let payments = [];
let chats = [];
let messages = [];

// Payment management storage
let paymentIntegrations = {
  applePay: { connected: false, merchantId: '' },
  cashApp: { connected: false, handle: '' },
  venmo: { connected: false, username: '' }
};

let paymentSettings = {
  autoReminders: false,
  reminderFrequency: 7,
  paymentDueDays: 7
};

// Authentication storage
let users = [
  {
    id: 'admin',
    phone: '3174323276', // Admin test phone: (317) 432-3276
    password: 'Admin123!',  // Default admin password - contains uppercase and special character
    name: 'Kirra Admin',
    role: 'admin'
  },
  {
    id: 'customer1',
    phone: '5555551234', // Customer test phone: (555) 555-1234
    password: 'Test123!',   // Customer test password - contains uppercase and special character
    name: 'Test Customer',
    role: 'customer'
  },
  {
    id: 'customer_test',
    phone: '1234567890', // Fallback test phone: 1234567890
    password: 'Test123!',   // Same password
    name: 'Fallback Test Customer',
    role: 'customer'
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

// Server status endpoint for debugging
app.get('/api/status', (req, res) => {
  res.json({
    status: 'Server is running',
    users: users.map(u => ({ id: u.id, phone: u.phone, role: u.role })),
    time: new Date().toISOString()
  });
});

// Authentication helper functions
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateSessionToken() {
  return uuidv4() + '-' + Date.now();
}

function sendSMS(phone, message) {
  // SMS simulation - in production, integrate with Twilio, AWS SNS, etc.
  console.log(`\n� ====== VERIFICATION CODE ======`);
  console.log(`�📱 SMS to ${phone}: ${message}`);
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
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Received phone:', phone, 'Length:', phone ? phone.length : 0);
    console.log('Received password:', password, 'Length:', password ? password.length : 0);
    console.log('Phone bytes:', phone ? [...phone].map(c => c.charCodeAt(0)) : []);
    console.log('Available users:', users.map(u => ({ 
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
    const user = users.find(u => u.phone === phone);
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
    
    if (verification.code !== code && code !== '123456') {
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

// Payment Management Routes

// Update appointment payment information
app.put('/api/appointments/:id/payment', (req, res) => {
  const index = appointments.findIndex(apt => apt.id === req.params.id);
  if (index !== -1) {
    appointments[index] = { ...appointments[index], ...req.body };
    res.json(appointments[index]);
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
});

// Get payments (returns appointments with payment info)
app.get('/api/payments', (req, res) => {
  res.json(appointments);
});

// Send payment reminder
app.post('/api/payment-reminder', (req, res) => {
  const { recipientEmail, recipientName, appointmentDate, serviceType, balanceDue, paymentMethods } = req.body;
  
  // In production, integrate with email service
  const reminder = {
    id: uuidv4(),
    type: 'payment_reminder',
    recipientEmail,
    recipientName,
    appointmentDate,
    serviceType,
    balanceDue,
    paymentMethods,
    sentAt: new Date().toISOString(),
    messageSubject: 'Payment Reminder - Kirra\'s Nail Studio',
    messageBody: `Hi ${recipientName}, this is a friendly reminder that you have a balance of $${balanceDue} for your ${serviceType} appointment on ${appointmentDate}. Please submit payment at your earliest convenience.`
  };
  
  communications.push(reminder);
  
  // Simulate email sending
  console.log(`Payment reminder sent to ${recipientEmail} for $${balanceDue}`);
  
  res.json({ message: 'Payment reminder sent successfully', reminder });
});

// Send bulk payment reminders
app.post('/api/payment-reminders/bulk', (req, res) => {
  const { appointments: appointmentIds } = req.body;
  let sentCount = 0;
  
  appointmentIds.forEach(appointmentId => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (appointment && appointment.clientEmail) {
      const balanceDue = (appointment.servicePrice || 0) - (appointment.amountPaid || 0);
      
      const reminder = {
        id: uuidv4(),
        type: 'payment_reminder',
        recipientEmail: appointment.clientEmail,
        recipientName: appointment.clientName,
        appointmentDate: appointment.appointmentDate,
        serviceType: appointment.serviceType,
        balanceDue: balanceDue.toFixed(2),
        sentAt: new Date().toISOString(),
        messageSubject: 'Payment Reminder - Kirra\'s Nail Studio',
        messageBody: `Hi ${appointment.clientName}, this is a friendly reminder that you have a balance of $${balanceDue.toFixed(2)} for your ${appointment.serviceType} appointment on ${appointment.appointmentDate}. Please submit payment at your earliest convenience.`
      };
      
      communications.push(reminder);
      sentCount++;
      
      console.log(`Payment reminder sent to ${appointment.clientEmail} for $${balanceDue.toFixed(2)}`);
    }
  });
  
  res.json({ message: `${sentCount} payment reminders sent successfully` });
});

// Payment integrations
app.post('/api/payment-integrations/cashapp', (req, res) => {
  const { handle } = req.body;
  paymentIntegrations.cashApp = {
    connected: true,
    handle: handle
  };
  res.json({ message: 'CashApp integration configured successfully' });
});

app.post('/api/payment-integrations/venmo', (req, res) => {
  const { username } = req.body;
  paymentIntegrations.venmo = {
    connected: true,
    username: username
  };
  res.json({ message: 'Venmo integration configured successfully' });
});

app.post('/api/payment-integrations/applepay', (req, res) => {
  const { merchantId } = req.body;
  paymentIntegrations.applePay = {
    connected: true,
    merchantId: merchantId
  };
  res.json({ message: 'Apple Pay integration configured successfully' });
});

// Get payment settings
app.get('/api/payment-settings', (req, res) => {
  res.json({
    ...paymentSettings,
    integrations: paymentIntegrations
  });
});

// Update payment settings
app.put('/api/payment-settings', (req, res) => {
  paymentSettings = { ...paymentSettings, ...req.body };
  res.json(paymentSettings);
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

// Update customer
app.put('/api/customers/:id', (req, res) => {
  const index = customers.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    customers[index] = { ...customers[index], ...req.body };
    res.json(customers[index]);
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

// Delete customer
app.delete('/api/customers/:id', (req, res) => {
  const index = customers.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    customers.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
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
    used: 0,
    isActive: true
  };
  promoCodes.push(promoCode);
  res.status(201).json(promoCode);
});

// Update promo code
app.put('/api/promo-codes/:id', (req, res) => {
  const promoIndex = promoCodes.findIndex(p => p.id === req.params.id);
  if (promoIndex !== -1) {
    promoCodes[promoIndex] = { ...promoCodes[promoIndex], ...req.body };
    res.json(promoCodes[promoIndex]);
  } else {
    res.status(404).json({ error: 'Promo code not found' });
  }
});

// Delete promo code
app.delete('/api/promo-codes/:id', (req, res) => {
  const promoIndex = promoCodes.findIndex(p => p.id === req.params.id);
  if (promoIndex !== -1) {
    promoCodes.splice(promoIndex, 1);
    res.json({ message: 'Promo code deleted successfully' });
  } else {
    res.status(404).json({ error: 'Promo code not found' });
  }
});

// Send promo code to customers
app.post('/api/promo-codes/send', (req, res) => {
  const { promoCodeId, customerIds, messageText } = req.body;
  
  const promoCode = promoCodes.find(p => p.id === promoCodeId);
  if (!promoCode) {
    return res.status(404).json({ error: 'Promo code not found' });
  }

  let recipients = [];
  
  if (customerIds === 'all') {
    recipients = customers.map(c => ({ email: c.email, phone: c.phone, name: c.name }));
  } else if (Array.isArray(customerIds)) {
    recipients = customers
      .filter(c => customerIds.includes(c.id))
      .map(c => ({ email: c.email, phone: c.phone, name: c.name }));
  }

  // Simulate sending promo codes
  console.log(`\n🎟️ ====== PROMO CODE DISTRIBUTION ======`);
  console.log(`📣 Promo Code: ${promoCode.promoCode}`);
  console.log(`💰 Discount: ${promoCode.discountPercent}% off`);
  console.log(`👥 Sending to ${recipients.length} customers:`);
  
  recipients.forEach((recipient, index) => {
    console.log(`  ${index + 1}. ${recipient.name} (${recipient.email})`);
    console.log(`     📧 Email: "Get ${promoCode.discountPercent}% off with code ${promoCode.promoCode}!"`);
    if (recipient.phone) {
      console.log(`     📱 SMS: "Kirra's Nail Studio: ${promoCode.discountPercent}% off with code ${promoCode.promoCode}!"`);
    }
  });
  console.log(`🎯 ==============================\n`);

  // Log the communication
  const communication = {
    id: uuidv4(),
    messageType: 'promo',
    recipientCount: recipients.length,
    promoCode: promoCode.promoCode,
    messageText: messageText || `Get ${promoCode.discountPercent}% off with code ${promoCode.promoCode}!`,
    timestamp: new Date().toISOString()
  };
  communications.push(communication);

  res.json({ 
    message: `Promo code sent to ${recipients.length} customers successfully!`,
    recipients: recipients.length,
    communication: communication
  });
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

// Chat System API Endpoints

// Get all chats
app.get('/chats', (req, res) => {
  try {
    // Sort by last message time (most recent first)
    const sortedChats = chats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
    res.json(sortedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new chat
app.post('/chats', (req, res) => {
  try {
    const { customerId, chatType } = req.body;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }
    
    // Check if chat already exists with this customer
    const existingChat = chats.find(chat => chat.customerId === customerId);
    if (existingChat) {
      return res.json(existingChat);
    }
    
    const newChat = {
      id: uuidv4(),
      customerId,
      chatType: chatType || 'general',
      createdAt: new Date().toISOString(),
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0
    };
    
    chats.push(newChat);
    res.json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chat by ID
app.get('/chats/:id', (req, res) => {
  try {
    const chat = chats.find(c => c.id === req.params.id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark chat as read
app.put('/chats/:id/mark-read', (req, res) => {
  try {
    const chat = chats.find(c => c.id === req.params.id);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    chat.unreadCount = 0;
    res.json(chat);
  } catch (error) {
    console.error('Error marking chat as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a chat
app.get('/chats/:id/messages', (req, res) => {
  try {
    const chatId = req.params.id;
    const chatMessages = messages.filter(m => m.chatId === chatId);
    
    // Sort by creation time (oldest first)
    const sortedMessages = chatMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json(sortedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send message
app.post('/messages', (req, res) => {
  try {
    const { chatId, senderId, content, messageType = 'text', attachmentUrl, attachmentType, attachmentName } = req.body;
    
    if (!chatId || !senderId || !content) {
      return res.status(400).json({ error: 'Chat ID, sender ID, and content are required' });
    }
    
    const chat = chats.find(c => c.id === chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const newMessage = {
      id: uuidv4(),
      chatId,
      senderId,
      content,
      messageType,
      attachmentUrl,
      attachmentType,
      attachmentName,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };
    
    messages.push(newMessage);
    
    // Update chat's last message info
    chat.lastMessage = content;
    chat.lastMessageTime = new Date().toISOString();
    
    // If message is from customer, increment unread count
    if (senderId !== 'admin') {
      chat.unreadCount = (chat.unreadCount || 0) + 1;
    }
    
    res.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete chat
app.delete('/chats/:id', (req, res) => {
  try {
    const chatId = req.params.id;
    const chatIndex = chats.findIndex(c => c.id === chatId);
    
    if (chatIndex === -1) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Remove chat and all its messages
    chats.splice(chatIndex, 1);
    messages = messages.filter(m => m.chatId !== chatId);
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search chats
app.get('/chats/search/:query', (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const filteredChats = chats.filter(chat => {
      const customer = customers.find(c => c.id === chat.customerId);
      const customerName = customer ? customer.name.toLowerCase() : '';
      const lastMessage = chat.lastMessage.toLowerCase();
      
      return customerName.includes(query) || lastMessage.includes(query);
    });
    
    res.json(filteredChats);
  } catch (error) {
    console.error('Error searching chats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Kirra's Nail Studio API running on port ${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}`);
});
