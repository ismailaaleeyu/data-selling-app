// backend/controllers/paymentController.js
const crypto = require('crypto');
const paymentService = require('../services/paymentService');
const db = require('../config/database');
const walletService = require('../services/walletService');

exports.initializePayment = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid payment amount.' });
    }

    let email = req.user.email;
    if (!email) {
      const [users] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
      if (users && users.length > 0) email = users[0].email;
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required to initialize payment.' });
    }

    const result = await paymentService.initializePayment(userId, email, amount);
    return res.json({ success: true, authorization_url: result.data.authorization_url, reference: result.data.reference });
  } catch (error) {
    console.error('Initialization controller error:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Unable to initialize payment.' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Transaction reference is required.' });
    }

    return res.json(await paymentService.verifyPayment(reference, userId));
  } catch (error) {
    console.error('Verification controller error:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Unable to verify payment.' });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    if (!signature || !req.rawBody) return res.status(401).send('Invalid signature');

    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(req.rawBody)
      .digest('hex');

    if (hash !== signature) return res.status(401).send('Invalid signature');

    const event = JSON.parse(req.rawBody.toString('utf8'));
    if (event.event !== 'charge.success' || event.data?.status !== 'success') {
      return res.sendStatus(200);
    }

    const reference = event.data.reference;
    const userId = Number(event.data.metadata?.userId);
    const amount = Number(event.data.amount) / 100;

    if (!reference || !Number.isInteger(userId) || userId <= 0 || !Number.isFinite(amount) || amount <= 0) {
      return res.sendStatus(200);
    }

    await walletService.creditWallet(userId, amount, 'Wallet Funding via Paystack', reference);
    return res.sendStatus(200);
  } catch (error) {
    console.error('Paystack webhook error:', error.message);
    return res.sendStatus(500);
  }
};
