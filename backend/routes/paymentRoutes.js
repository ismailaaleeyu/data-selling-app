const express = require('express');

const PaymentController = require('../controllers/paymentController');

const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Initialize Paystack payment
router.post(
  '/initialize',
  authMiddleware,
  PaymentController.initializePayment
);

// Verify Paystack payment
router.get(
  '/verify/:reference',
  authMiddleware,
  PaymentController.verifyPayment
);

// Paystack webhook
router.post(
  '/webhook',
  PaymentController.handleWebhook
);

module.exports = router;