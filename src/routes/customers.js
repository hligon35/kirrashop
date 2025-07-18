/**
 * Customers routes
 */
const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers');

// Customer routes
router.get('/', customersController.getCustomers);
router.post('/', customersController.createCustomer);
router.put('/:id', customersController.updateCustomer);
router.delete('/:id', customersController.deleteCustomer);

module.exports = router;
