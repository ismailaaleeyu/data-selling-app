// backend/routes/paymentRoutes.js

const express = require('express');
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/initialize', authMiddleware, PaymentController.initializePayment);
router.get('/verify/:reference', authMiddleware, PaymentController.verifyPayment);
router.post('/webhook', PaymentController.handleWebhook);

module.exports = router;
