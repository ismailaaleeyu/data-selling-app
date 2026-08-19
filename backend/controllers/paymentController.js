const crypto = require('crypto');
const pool = require('../config/database');
const PaymentService = require('../services/paymentService');
const WalletService = require('../services/walletService');

class PaymentController {

  // ==============================
  // INITIALIZE PAYMENT
  // ==============================
  static async initializePayment(req, res) {
    try {
      const { amount } = req.body;

      const numericAmount = Number(amount);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid amount',
        });
      }

      if (numericAmount < 100) {
        return res.status(400).json({
          success: false,
          message: 'Minimum wallet funding amount is ₦100',
        });
      }

      const [users] = await pool.execute(
        'SELECT id, name, email FROM users WHERE id = ?',
        [req.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const user = users[0];

      const reference = `WALLET-${user.id}-${Date.now()}-${crypto
        .randomBytes(4)
        .toString('hex')}`;

      const payment = await PaymentService.initializePayment({
        email: user.email,
        amount: numericAmount,
        reference,
      });

      if (!payment.status || !payment.data) {
        return res.status(500).json({
          success: false,
          message: 'Unable to initialize payment',
        });
      }

      res.json({
        success: true,
        message: 'Payment initialized successfully',
        reference,
        authorization_url: payment.data.authorization_url,
        access_code: payment.data.access_code,
      });

    } catch (error) {
      console.error(
        'Paystack initialization error:',
        error.response?.data || error.message
      );

      res.status(500).json({
        success: false,
        message: 'Unable to initialize payment',
      });
    }
  }


  // ==============================
  // VERIFY PAYMENT
  // ==============================
  static async verifyPayment(req, res) {
    try {
      const { reference } = req.params;

      if (!reference) {
        return res.status(400).json({
          success: false,
          message: 'Payment reference is required',
        });
      }

      const payment = await PaymentService.verifyPayment(reference);

      if (!payment.status || !payment.data) {
        return res.status(400).json({
          success: false,
          message: 'Unable to verify payment',
        });
      }

      const transaction = payment.data;

      if (transaction.status !== 'success') {
        return res.status(400).json({
          success: false,
          message: 'Payment was not successful',
          paymentStatus: transaction.status,
        });
      }

      const paidAmount = Number(transaction.amount) / 100;

      if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment amount',
        });
      }

      const [users] = await pool.execute(
        'SELECT id, email FROM users WHERE id = ?',
        [req.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const user = users[0];

      if (
        transaction.customer?.email &&
        transaction.customer.email.toLowerCase() !==
          user.email.toLowerCase()
      ) {
        return res.status(403).json({
          success: false,
          message: 'Payment does not belong to this account',
        });
      }

      const [existingTransactions] = await pool.execute(
        `SELECT id, user_id, amount, status
         FROM wallet_transactions
         WHERE reference = ?
         LIMIT 1`,
        [reference]
      );

      if (existingTransactions.length > 0) {
        const existing = existingTransactions[0];

        if (existing.status === 'completed') {
          return res.json({
            success: true,
            message: 'Payment has already been credited',
            alreadyProcessed: true,
            reference,
            amount: Number(existing.amount),
          });
        }

        return res.status(409).json({
          success: false,
          message: 'Payment reference has already been processed',
        });
      }

      await WalletService.creditWallet(
        req.userId,
        paidAmount,
        'Wallet Funding via Paystack',
        reference
      );

      res.json({
        success: true,
        message: 'Payment verified and wallet credited successfully',
        reference,
        amount: paidAmount,
      });

    } catch (error) {
      console.error(
        'Paystack verification error:',
        error.response?.data || error.message
      );

      res.status(500).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  }


  // ==============================
  // PAYSTACK WEBHOOK
  // ==============================
  static async handleWebhook(req, res) {
    try {
      const signature = req.headers['x-paystack-signature'];

      if (!signature) {
        console.error('Paystack webhook: missing signature');
        return res.status(401).send('Missing signature');
      }

      // Verify Paystack webhook signature
      const hash = crypto
        .createHmac(
          'sha512',
          process.env.PAYSTACK_SECRET_KEY
        )
        .update(req.rawBody)
        .digest('hex');

      if (hash !== signature) {
        console.error('Paystack webhook: invalid signature');
        return res.status(401).send('Invalid signature');
      }

      const event = req.body;

      console.log(
        'Paystack webhook received:',
        event.event
      );

      // We only process successful charges
      if (event.event !== 'charge.success') {
        return res.sendStatus(200);
      }

      const transaction = event.data;

      if (!transaction) {
        console.error(
          'Paystack webhook: missing transaction data'
        );
        return res.sendStatus(200);
      }

      const reference = transaction.reference;

      if (!reference) {
        console.error(
          'Paystack webhook: missing reference'
        );
        return res.sendStatus(200);
      }

      if (transaction.status !== 'success') {
        return res.sendStatus(200);
      }

      const paidAmount = Number(transaction.amount) / 100;

      if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
        console.error(
          'Paystack webhook: invalid amount',
          transaction.amount
        );
        return res.sendStatus(200);
      }

      // Check whether payment was already processed
      const [existingTransactions] = await pool.execute(
        `SELECT id, user_id, amount, status
         FROM wallet_transactions
         WHERE reference = ?
         LIMIT 1`,
        [reference]
      );

      if (existingTransactions.length > 0) {
        console.log(
          `Payment ${reference} already processed`
        );

        return res.sendStatus(200);
      }

      // Extract user ID from our reference:
      // WALLET-{userId}-{timestamp}-{random}
      const referenceParts = reference.split('-');

      if (
        referenceParts.length < 3 ||
        referenceParts[0] !== 'WALLET'
      ) {
        console.error(
          'Invalid wallet reference:',
          reference
        );

        return res.sendStatus(200);
      }

      const userId = Number(referenceParts[1]);

      if (!Number.isInteger(userId) || userId <= 0) {
        console.error(
          'Invalid user ID in reference:',
          reference
        );

        return res.sendStatus(200);
      }

      // Verify user exists
      const [users] = await pool.execute(
        `SELECT id, email
         FROM users
         WHERE id = ?`,
        [userId]
      );

      if (users.length === 0) {
        console.error(
          'User not found for payment:',
          reference
        );

        return res.sendStatus(200);
      }

      // Verify customer's Paystack email
      const paystackEmail =
        transaction.customer?.email?.toLowerCase();

      const userEmail =
        users[0].email.toLowerCase();

      if (
        paystackEmail &&
        paystackEmail !== userEmail
      ) {
        console.error(
          `Email mismatch for payment ${reference}`
        );

        return res.sendStatus(200);
      }

      // Credit wallet
      await WalletService.creditWallet(
        userId,
        paidAmount,
        'Wallet Funding via Paystack',
        reference
      );

      console.log(
        `Wallet credited successfully: User ${userId}, ₦${paidAmount}, Ref ${reference}`
      );

      return res.sendStatus(200);

    } catch (error) {
      console.error(
        'Paystack webhook error:',
        error.response?.data || error.message
      );

      return res.sendStatus(500);
    }
  }
}

module.exports = PaymentController;