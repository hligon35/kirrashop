/**
 * Finances routes
 */
const express = require('express');
const router = express.Router();
const financesController = require('../controllers/finances');

// Finance routes
router.get('/', financesController.getFinances);
router.post('/transaction', financesController.recordTransaction);

module.exports = router;
