// backend/controllers/paymentController.js
const paymentService = require('../services/paymentService');
const db = require('../config/database');

/**
 * Initialize Payment with Paystack
 */
exports.initializePayment = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid payment amount.' 
      });
    }

    // 1. Get email directly from auth middleware or database
    let email = req.user.email;

    if (!email) {
      // Database fallback if req.user only contains ID
      const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
      if (users && users.length > 0) {
        email = users[0].email;
      }
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'User email is required to initialize payment.'
      });
    }

    // 2. Initialize with Paystack service
    const result = await paymentService.initializePayment(userId, email, amount);

    return res.json({
      success: true,
      authorization_url: result.data.authorization_url,
      reference: result.data.reference
    });

  } catch (error) {
    console.error('Initialization controller error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to initialize payment.'
    });
  }
};

/**
 * Verify Payment Reference & Credit Wallet
 */
exports.verifyPayment = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Transaction reference is required.'
      });
    }

    const result = await paymentService.verifyPayment(reference, userId);

    return res.json(result);

  } catch (error) {
    console.error('Verification controller error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Unable to verify payment.'
    });
  }
};
