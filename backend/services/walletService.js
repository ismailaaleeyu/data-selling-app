// Wallet service - handles wallet operations and balance management

const pool = require('../config/database');

class WalletService {

  // ==============================
  // CREDIT WALLET
  // ==============================
  static async creditWallet(
    userId,
    amount,
    description,
    reference = null
  ) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Validate amount
      const numericAmount = Number(amount);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error('Invalid wallet credit amount');
      }

      // Check user exists and lock the row
      const [users] = await connection.execute(
        `SELECT id, wallet_balance
         FROM users
         WHERE id = ?
         FOR UPDATE`,
        [userId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      // If a reference exists, check whether it was already processed
      if (reference) {
        const [existing] = await connection.execute(
          `SELECT id, status
           FROM wallet_transactions
           WHERE reference = ?
           LIMIT 1`,
          [reference]
        );

        if (existing.length > 0) {
          if (existing[0].status === 'completed') {
            await connection.rollback();

            return {
              success: true,
              alreadyProcessed: true,
              message: 'Payment has already been credited'
            };
          }

          throw new Error(
            'Transaction reference has already been used'
          );
        }
      }

      // Credit wallet
      await connection.execute(
        `UPDATE users
         SET wallet_balance = wallet_balance + ?
         WHERE id = ?`,
        [numericAmount, userId]
      );

      // Record wallet transaction
      await connection.execute(
        `INSERT INTO wallet_transactions
          (user_id, amount, type, description, status, reference)
         VALUES (?, ?, 'credit', ?, 'completed', ?)`,
        [
          userId,
          numericAmount,
          description,
          reference
        ]
      );

      await connection.commit();

      return {
        success: true,
        alreadyProcessed: false,
        message: 'Wallet credited successfully'
      };

    } catch (error) {
      await connection.rollback();
      throw error;

    } finally {
      connection.release();
    }
  }


  // ==============================
  // DEBIT WALLET
  // ==============================
  static async debitWallet(
    userId,
    amount,
    description,
    reference = null
  ) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const numericAmount = Number(amount);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error('Invalid wallet debit amount');
      }

      // Lock user wallet row
      const [users] = await connection.execute(
        `SELECT id, wallet_balance
         FROM users
         WHERE id = ?
         FOR UPDATE`,
        [userId]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const balance = Number(users[0].wallet_balance);

      if (balance < numericAmount) {
        throw new Error('Insufficient wallet balance');
      }

      // Check reference if supplied
      if (reference) {
        const [existing] = await connection.execute(
          `SELECT id
           FROM wallet_transactions
           WHERE reference = ?
           LIMIT 1`,
          [reference]
        );

        if (existing.length > 0) {
          throw new Error(
            'Transaction reference has already been used'
          );
        }
      }

      // Debit wallet
      await connection.execute(
        `UPDATE users
         SET wallet_balance = wallet_balance - ?
         WHERE id = ?`,
        [numericAmount, userId]
      );

      // Record transaction
      await connection.execute(
        `INSERT INTO wallet_transactions
          (user_id, amount, type, description, status, reference)
         VALUES (?, ?, 'debit', ?, 'completed', ?)`,
        [
          userId,
          numericAmount,
          description,
          reference
        ]
      );

      await connection.commit();

      return {
        success: true,
        message: 'Wallet debited successfully'
      };

    } catch (error) {
      await connection.rollback();
      throw error;

    } finally {
      connection.release();
    }
  }


  // ==============================
  // REFUND WALLET
  // ==============================
  static async refundWallet(
    userId,
    amount,
    description,
    reference = null
  ) {
    return this.creditWallet(
      userId,
      amount,
      `Refund: ${description}`,
      reference
    );
  }


  // ==============================
  // GET WALLET DETAILS
  // ==============================
  static async getWalletDetails(userId) {
    const [users] = await pool.execute(
      `SELECT id, wallet_balance
       FROM users
       WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      throw new Error('User not found');
    }

    return {
      balance: users[0].wallet_balance,
      userId: users[0].id,
      lastUpdated: new Date().toISOString()
    };
  }


  // ==============================
  // GET TRANSACTION HISTORY
  // ==============================
  static async getTransactionHistory(
    userId,
    page = 1,
    limit = 20
  ) {
    const offset = (page - 1) * limit;

    const [transactions] = await pool.execute(
      `SELECT *
       FROM wallet_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, Number(limit), Number(offset)]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM wallet_transactions
       WHERE user_id = ?`,
      [userId]
    );

    const total = Number(countResult[0].total);

    return {
      transactions,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    };
  }
}

module.exports = WalletService;