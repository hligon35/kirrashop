/**
 * Customers controller
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

/**
 * Get all customers
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getCustomers(req, res) {
  res.json(db.customers);
}

/**
 * Create new customer
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function createCustomer(req, res) {
  const customer = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  db.customers.push(customer);
  res.status(201).json(customer);
}

/**
 * Update customer
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function updateCustomer(req, res) {
  const index = db.customers.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    db.customers[index] = { ...db.customers[index], ...req.body };
    res.json(db.customers[index]);
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
}

/**
 * Delete customer
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function deleteCustomer(req, res) {
  const index = db.customers.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    db.customers.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
}

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
