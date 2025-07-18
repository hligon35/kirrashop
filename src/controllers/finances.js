/**
 * Finances controller
 */
const db = require('../models');

/**
 * Get finances
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getFinances(req, res) {
  res.json(db.finances);
}

/**
 * Record financial transaction
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function recordTransaction(req, res) {
  const { type, amount, description } = req.body;
  if (type === 'revenue') {
    db.finances.revenue += amount;
    db.finances.balance += amount;
  } else if (type === 'expense') {
    db.finances.expenses += amount;
    db.finances.balance -= amount;
  }
  res.json(db.finances);
}

module.exports = {
  getFinances,
  recordTransaction
};
