const pool = require('../config/database');
const walletService = require('./walletService');
const vtpassService = require('./vtpassService');

class AirtimeService {

  // ==========================================
  // BUY AIRTIME
  // ==========================================
  static async buyAirtime(userId, phoneNumber, planId) {
    const connection = await pool.getConnection();

    let reference;
    let amount;
    let plan;

    try {
      // ----------------------------------------
      // Validate user
      // ----------------------------------------
      const [users] = await connection.execute(
        `SELECT id, email, wallet_balance
         FROM users
         WHERE id = ?`,
        [userId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      // ----------------------------------------
      // Validate phone
      // ----------------------------------------
      const phone = String(phoneNumber || '').replace(/\s+/g, '');

      if (!/^0\d{10}$/.test(phone)) {
        throw new Error(
          'Please provide a valid Nigerian phone number'
        );
      }

      // ----------------------------------------
      // Get plan
      // ----------------------------------------
      const [plans] = await connection.execute(
        `SELECT id, provider, amount, description
         FROM airtime_plans
         WHERE id = ?
         AND active = TRUE`,
        [planId]
      );

      if (plans.length === 0) {
        throw new Error(
          'Airtime plan not found or inactive'
        );
      }

      plan = plans[0];

      amount = Number(plan.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Invalid airtime amount');
      }

      // ----------------------------------------
      // Map provider to VTpass service ID
      // ----------------------------------------
      const serviceID =
        this.getServiceId(plan.provider);

      if (!serviceID) {
        throw new Error(
          `Airtime provider ${plan.provider} is not supported`
        );
      }

      // ----------------------------------------
      // Generate unique reference
      // ----------------------------------------
      reference =
        `AIR-${userId}-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)}`;

      // ----------------------------------------
      // START DATABASE TRANSACTION
      // ----------------------------------------
      await connection.beginTransaction();

      // Lock user's wallet
      const [lockedUsers] = await connection.execute(
        `SELECT wallet_balance
         FROM users
         WHERE id = ?
         FOR UPDATE`,
        [userId]
      );

      if (lockedUsers.length === 0) {
        throw new Error('User not found');
      }

      const balance =
        Number(lockedUsers[0].wallet_balance);

      if (balance < amount) {
        throw new Error(
          'Insufficient wallet balance'
        );
      }

      // ----------------------------------------
      // Create pending airtime transaction
      // ----------------------------------------
      await connection.execute(
        `INSERT INTO airtime_transactions
          (user_id, phone_number, plan_id, amount, status, reference)
         VALUES (?, ?, ?, ?, 'pending', ?)`,
        [
          userId,
          phone,
          plan.id,
          amount,
          reference
        ]
      );

      // ----------------------------------------
      // Debit wallet
      // ----------------------------------------
      await connection.execute(
        `UPDATE users
         SET wallet_balance = wallet_balance - ?
         WHERE id = ?`,
        [amount, userId]
      );

      // ----------------------------------------
      // Record wallet debit
      // ----------------------------------------
      await connection.execute(
        `INSERT INTO wallet_transactions
          (user_id, amount, type, description, status, reference)
         VALUES (?, ?, 'debit', ?, 'completed', ?)`,
        [
          userId,
          amount,
          `Airtime purchase: ₦${amount} to ${phone}`,
          reference
        ]
      );

      // Commit wallet + airtime transaction
      await connection.commit();

    } catch (error) {

      try {
        await connection.rollback();
      } catch (_) {}

      console.error(
        'Airtime preparation error:',
        error.message
      );

      throw error;

    } finally {
      connection.release();
    }

    // ==========================================
    // CALL VTPASS
    // ==========================================

    let vtpassResponse;

    try {

      vtpassResponse =
        await vtpassService.buyAirtime({
          serviceID:
            this.getServiceId(plan.provider),
          phone: phoneNumber,
          amount
        });

    } catch (providerError) {

      console.error(
        'VTpass request failed:',
        providerError.message
      );

      await this.failAndRefund(
        userId,
        amount,
        reference,
        providerError.message
      );

      throw new Error(
        'Airtime provider failed. Your wallet has been refunded.'
      );
    }

    // ==========================================
    // PROCESS VTPASS RESPONSE
    // ==========================================

    const vtpassCode =
      String(vtpassResponse.code || '');

    const transaction =
      vtpassResponse.content?.transactions;

    const providerStatus =
      transaction?.status;

    const requestId =
      vtpassResponse.requestId ||
      vtpassResponse.request_id ||
      null;

    const vtpassTransactionId =
      transaction?.transactionId ||
      null;

    // ------------------------------------------
    // Save VTpass references
    // ------------------------------------------
    await pool.execute(
      `UPDATE airtime_transactions
       SET vtpass_request_id = ?,
           vtpass_transaction_id = ?
       WHERE reference = ?`,
      [
        requestId,
        vtpassTransactionId,
        reference
      ]
    );

    // ------------------------------------------
    // DELIVERED
    // ------------------------------------------
    if (
      vtpassCode === '000' &&
      providerStatus === 'delivered'
    ) {

      await pool.execute(
        `UPDATE airtime_transactions
         SET status = 'completed'
         WHERE reference = ?`,
        [reference]
      );

      return {
        success: true,
        status: 'completed',
        reference,
        providerReference:
          vtpassTransactionId || requestId,
        amount,
        phone: phoneNumber,
        provider: plan.provider,
        message:
          'Airtime purchased successfully'
      };
    }

    // ------------------------------------------
    // PENDING
    // ------------------------------------------
    if (
      vtpassCode === '099' ||
      providerStatus === 'pending' ||
      providerStatus === 'initiated'
    ) {

      return {
        success: true,
        status: 'pending',
        reference,
        providerReference:
          vtpassTransactionId || requestId,
        amount,
        phone: phoneNumber,
        provider: plan.provider,
        message:
          'Airtime purchase is being processed'
      };
    }

    // ------------------------------------------
    // FAILED
    // ------------------------------------------
    await this.failAndRefund(
      userId,
      amount,
      reference,
      vtpassResponse.response_description ||
        `VTpass transaction failed (${vtpassCode})`
    );

    return {
      success: false,
      status: 'failed',
      reference,
      amount,
      message:
        'Airtime purchase failed. Your wallet has been refunded.'
    };
  }


  // ==========================================
  // FAIL + REFUND
  // ==========================================
  static async failAndRefund(
    userId,
    amount,
    reference,
    reason
  ) {

    const connection =
      await pool.getConnection();

    try {

      await connection.beginTransaction();

      // Lock the wallet
      const [users] =
        await connection.execute(
          `SELECT wallet_balance
           FROM users
           WHERE id = ?
           FOR UPDATE`,
          [userId]
        );

      if (users.length === 0) {
        throw new Error('User not found during refund');
      }

      // Check if already refunded
      const refundReference =
        `REFUND-${reference}`;

      const [existing] =
        await connection.execute(
          `SELECT id
           FROM wallet_transactions
           WHERE reference = ?
           LIMIT 1`,
          [refundReference]
        );

      if (existing.length > 0) {

        await connection.rollback();

        return {
          success: true,
          alreadyRefunded: true
        };
      }

      // Refund wallet
      await connection.execute(
        `UPDATE users
         SET wallet_balance =
             wallet_balance + ?
         WHERE id = ?`,
        [amount, userId]
      );

      // Record refund
      await connection.execute(
        `INSERT INTO wallet_transactions
          (user_id, amount, type, description, status, reference)
         VALUES (?, ?, 'credit', ?, 'completed', ?)`,
        [
          userId,
          amount,
          `Airtime refund: ${reason}`,
          refundReference
        ]
      );

      // Mark airtime failed
      await connection.execute(
        `UPDATE airtime_transactions
         SET status = 'failed'
         WHERE reference = ?`,
        [reference]
      );

      await connection.commit();

      return {
        success: true,
        alreadyRefunded: false
      };

    } catch (error) {

      try {
        await connection.rollback();
      } catch (_) {}

      console.error(
        'Airtime refund error:',
        error.message
      );

      throw new Error(
        'Airtime failed and automatic refund could not be completed.'
      );

    } finally {
      connection.release();
    }
  }


  // ==========================================
  // PROVIDER MAPPING
  // ==========================================
  static getServiceId(provider) {

    const normalized =
      String(provider || '')
        .trim()
        .toLowerCase();

    const providers = {
      mtn: 'mtn',
      airtel: 'airtel',
      glo: 'glo',
      '9mobile': 'etisalat',
      etisalat: 'etisalat'
    };

    return providers[normalized] || null;
  }
}

module.exports = AirtimeService;