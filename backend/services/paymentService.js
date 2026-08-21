const axios = require('axios');

class PaymentService {
  static async initializePayment({ email, amount, reference }) {
    const amountInKobo = Math.round(Number(amount) * 100);

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amountInKobo,
        reference,
        currency: 'NGN',
        callback_url: 'http://localhost:3000/?payment=success',
        metadata: {
          custom_fields: [
            {
              display_name: 'Payment Type',
              variable_name: 'payment_type',
              value: 'Wallet Funding',
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }
// backend/services/paymentService.js
async function verifyPayment(reference, userId) {
  // 1. Call Paystack API to verify reference status
  const paystackData = await verifyWithPaystack(reference);

  if (paystackData.status && paystackData.data.status === 'success') {
    const amountInNaira = paystackData.data.amount / 100;

    // 2. Add funds directly to wallet using walletService
    const updatedWallet = await walletService.addFunds(userId, amountInNaira, reference);

    return {
      success: true,
      amount: amountInNaira,
      balance: updatedWallet.balance
    };
  }

  return { success: false, message: 'Payment verification failed' };
}
  

module.exports = PaymentService;
