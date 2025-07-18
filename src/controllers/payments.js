/**
 * Payments controller
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

/**
 * Get all payments
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getPayments(req, res) {
  res.json(db.appointments);
}

/**
 * Send payment reminder
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function sendPaymentReminder(req, res) {
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
  
  db.communications.push(reminder);
  
  // Simulate email sending
  console.log(`Payment reminder sent to ${recipientEmail} for $${balanceDue}`);
  
  res.json({ message: 'Payment reminder sent successfully', reminder });
}

/**
 * Send bulk payment reminders
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function sendBulkPaymentReminders(req, res) {
  const { appointments: appointmentIds } = req.body;
  let sentCount = 0;
  
  appointmentIds.forEach(appointmentId => {
    const appointment = db.appointments.find(apt => apt.id === appointmentId);
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
      
      db.communications.push(reminder);
      sentCount++;
      
      console.log(`Payment reminder sent to ${appointment.clientEmail} for $${balanceDue.toFixed(2)}`);
    }
  });
  
  res.json({ message: `${sentCount} payment reminders sent successfully` });
}

/**
 * Configure CashApp integration
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function configureCashApp(req, res) {
  const { handle } = req.body;
  db.paymentIntegrations.cashApp = {
    connected: true,
    handle: handle
  };
  res.json({ message: 'CashApp integration configured successfully' });
}

/**
 * Configure Venmo integration
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function configureVenmo(req, res) {
  const { username } = req.body;
  db.paymentIntegrations.venmo = {
    connected: true,
    username: username
  };
  res.json({ message: 'Venmo integration configured successfully' });
}

/**
 * Configure Apple Pay integration
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function configureApplePay(req, res) {
  const { merchantId } = req.body;
  db.paymentIntegrations.applePay = {
    connected: true,
    merchantId: merchantId
  };
  res.json({ message: 'Apple Pay integration configured successfully' });
}

/**
 * Get payment settings
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getPaymentSettings(req, res) {
  res.json({
    ...db.paymentSettings,
    integrations: db.paymentIntegrations
  });
}

/**
 * Update payment settings
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function updatePaymentSettings(req, res) {
  db.paymentSettings = { ...db.paymentSettings, ...req.body };
  res.json(db.paymentSettings);
}

module.exports = {
  getPayments,
  sendPaymentReminder,
  sendBulkPaymentReminders,
  configureCashApp,
  configureVenmo,
  configureApplePay,
  getPaymentSettings,
  updatePaymentSettings
};
