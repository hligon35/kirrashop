/**
 * Promo codes routes
 */
const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promos');

// Promo code routes
router.get('/', promoController.getPromoCodes);
router.post('/', promoController.createPromoCode);
router.put('/:id', promoController.updatePromoCode);
router.delete('/:id', promoController.deletePromoCode);
router.post('/send', promoController.sendPromoCode);

module.exports = router;
