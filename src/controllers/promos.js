/**
 * Promo codes controller
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

/**
 * Get all promo codes
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getPromoCodes(req, res) {
  res.json(db.promoCodes);
}

/**
 * Create new promo code
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function createPromoCode(req, res) {
  const promoCode = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    used: 0,
    isActive: true
  };
  db.promoCodes.push(promoCode);
  res.status(201).json(promoCode);
}

/**
 * Update promo code
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function updatePromoCode(req, res) {
  const promoIndex = db.promoCodes.findIndex(p => p.id === req.params.id);
  if (promoIndex !== -1) {
    db.promoCodes[promoIndex] = { ...db.promoCodes[promoIndex], ...req.body };
    res.json(db.promoCodes[promoIndex]);
  } else {
    res.status(404).json({ error: 'Promo code not found' });
  }
}

/**
 * Delete promo code
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function deletePromoCode(req, res) {
  const promoIndex = db.promoCodes.findIndex(p => p.id === req.params.id);
  if (promoIndex !== -1) {
    db.promoCodes.splice(promoIndex, 1);
    res.json({ message: 'Promo code deleted successfully' });
  } else {
    res.status(404).json({ error: 'Promo code not found' });
  }
}

/**
 * Send promo code to customers
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function sendPromoCode(req, res) {
  const { promoCodeId, customerIds, messageText } = req.body;
  
  const promoCode = db.promoCodes.find(p => p.id === promoCodeId);
  if (!promoCode) {
    return res.status(404).json({ error: 'Promo code not found' });
  }

  let recipients = [];
  
  if (customerIds === 'all') {
    recipients = db.customers.map(c => ({ email: c.email, phone: c.phone, name: c.name }));
  } else if (Array.isArray(customerIds)) {
    recipients = db.customers
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
  db.communications.push(communication);

  res.json({ 
    message: `Promo code sent to ${recipients.length} customers successfully!`,
    recipients: recipients.length,
    communication: communication
  });
}

module.exports = {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  sendPromoCode
};
