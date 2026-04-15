const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protectUser } = require('../middleware/auth.middleware');

// Public routes
router.get('/packages', paymentController.getPackages);

// Protected routes
router.use(protectUser);
router.post('/validate-promo', paymentController.validatePromoCode);
router.post('/create-order', paymentController.createOrder);
router.post('/capture-order', paymentController.captureOrder);
router.get('/history', paymentController.getHistory);

module.exports = router;
