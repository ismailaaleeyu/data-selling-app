const axios = require('axios');
const walletService = require('./walletService');

class PaymentService {
  /**
   * Initialize Paystack Payment
   */
  async initializePayment(userId, email, amount) {
    try {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email,
          amount: Math.round(amount * 100), // Convert Naira to Kobo
          callback_url: process.env.FRONTEND_URL,
          metadata: { userId }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        'Paystack initialization error:',
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.message || 'Failed to initialize payment'
      );
    }
  }

  /**
   * Verify Paystack Payment & Credit Wallet
   */
  async verifyPayment(reference, userId) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      const data = response.data;

      // Make sure Paystack verification itself was successful
      if (!data.status || !data.data || data.data.status !== 'success') {
        return {
          success: false,
          message: data.message || 'Payment verification failed'
        };
      }

      const transaction = data.data;

      // -----------------------------------------
      // Verify transaction belongs to this user
      // -----------------------------------------
      const paystackUserId = transaction.metadata?.userId;

      if (
        paystackUserId !== undefined &&
        Number(paystackUserId) !== Number(userId)
      ) {
        console.error(
          `Payment ownership mismatch. Paystack userId: ${paystackUserId}, authenticated userId: ${userId}`
        );

        return {
          success: false,
          message: 'Payment does not belong to this user'
        };
      }

      // -----------------------------------------
      // Convert Kobo to Naira
      // -----------------------------------------
      const amountInNaira = Number(transaction.amount) / 100;

      if (!Number.isFinite(amountInNaira) || amountInNaira <= 0) {
        return {
          success: false,
          message: 'Invalid payment amount'
        };
      }

      // -----------------------------------------
      // Credit wallet
      // -----------------------------------------
      const wallet = await walletService.creditWallet(
        userId,
        amountInNaira,
        'Wallet Funding via Paystack',
        reference
      );

      // -----------------------------------------
      // Get updated wallet balance
      // -----------------------------------------
      const walletDetails = await walletService.getWalletDetails(userId);

      return {
        success: true,
        amount: amountInNaira,
        balance: walletDetails.balance,
        alreadyProcessed: wallet.alreadyProcessed || false,
        message:
          wallet.message ||
          'Payment verified and wallet funded successfully'
      };

    } catch (error) {
      console.error(
        'Paystack verification error:',
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.message || 'Failed to verify payment'
      );
    }
  }
}

module.exports = new PaymentService();
