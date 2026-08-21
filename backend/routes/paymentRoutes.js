// backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth'); // Adjust auth middleware path/name if different

// POST /api/payment/initialize
router.post('/initialize', authMiddleware, paymentController.initializePayment);

// GET /api/payment/verify/:reference
router.get('/verify/:reference', authMiddleware, paymentController.verifyPayment);

module.exports = router;
