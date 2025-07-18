/**
 * Communications routes
 */
const express = require('express');
const router = express.Router();
const communicationsController = require('../controllers/communications');

// Communication routes
router.get('/', communicationsController.getCommunications);
router.post('/', communicationsController.createCommunication);

module.exports = router;
