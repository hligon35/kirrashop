/**
 * Main route index file
 */
const express = require('express');
const router = express.Router();
const path = require('path');

// Import route modules
const authRoutes = require('./auth');
const appointmentsRoutes = require('./appointments');
const paymentsRoutes = require('./payments');
const customersRoutes = require('./customers');
const financesRoutes = require('./finances');
const promosRoutes = require('./promos');
const communicationsRoutes = require('./communications');
const galleryRoutes = require('./gallery');
const chatRoutes = require('./chat');
const fileRoutes = require('./files');

// Mount routes
router.use('/api/auth', authRoutes);
router.use('/api/appointments', appointmentsRoutes);
router.use('/api/payments', paymentsRoutes);
router.use('/api/customers', customersRoutes);
router.use('/api/finances', financesRoutes);
router.use('/api/promo-codes', promosRoutes);
router.use('/api/communications', communicationsRoutes);
router.use('/api/gallery', galleryRoutes);
router.use('/chats', chatRoutes);

// File routes
router.use('/', fileRoutes);

// Serve login page
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/login.html'));
});

router.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/login.html'));
});

// Serve main application
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

module.exports = router;
