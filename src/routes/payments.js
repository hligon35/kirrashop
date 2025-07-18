/**
 * Payments routes
 */
const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments');

// Payment routes
router.get('/', paymentsController.getPayments);
router.post('/reminder', paymentsController.sendPaymentReminder);
router.post('/reminders/bulk', paymentsController.sendBulkPaymentReminders);

// Payment integrations
router.post('/integrations/cashapp', paymentsController.configureCashApp);
router.post('/integrations/venmo', paymentsController.configureVenmo);
router.post('/integrations/applepay', paymentsController.configureApplePay);

// Payment settings
router.get('/settings', paymentsController.getPaymentSettings);
router.put('/settings', paymentsController.updatePaymentSettings);

module.exports = router;
