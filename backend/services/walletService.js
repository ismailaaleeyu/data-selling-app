// Wallet service - handles wallet operations and balance management
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const pool = require('../config/database');

class WalletService {
  // Credit wallet amount
  static async creditWallet(userId, amount, description) {
    const connection = await pool.getConnection();
    try {
      // Start transaction for atomic operation
      await connection.beginTransaction();

      // Update user wallet balance
      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
        [amount, userId]
      );

      // Log transaction
      await connection.execute(
        `INSERT INTO wallet_transactions (user_id, amount, type, description, status)
         VALUES (?, ?, 'credit', ?, 'completed')`,
        [userId, amount, description]
      );

      await connection.commit();

      return {
        success: true,
        message: 'Wallet credited successfully',
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Debit wallet amount
  static async debitWallet(userId, amount, description) {
    const connection = await pool.getConnection();
    try {
      // Start transaction for atomic operation
      await connection.beginTransaction();

      // Check if user has sufficient balance
      const [userRows] = await connection.execute(
        'SELECT wallet_balance FROM users WHERE id = ? FOR UPDATE',
        [userId]
      );

      if (!userRows[0] || userRows[0].wallet_balance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      // Deduct from wallet
      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
        [amount, userId]
      );

      // Log transaction
      await connection.execute(
        `INSERT INTO wallet_transactions (user_id, amount, type, description, status)
         VALUES (?, ?, 'debit', ?, 'completed')`,
        [userId, amount, description]
      );

      await connection.commit();

      return {
        success: true,
        message: 'Wallet debited successfully',
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Refund wallet amount (used when transaction fails)
  static async refundWallet(userId, amount, description) {
    return this.creditWallet(userId, amount, `Refund: ${description}`);
  }

  // Get wallet details
  static async getWalletDetails(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      balance: user.wallet_balance,
      userId: user.id,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Get wallet transaction history
  static async getTransactionHistory(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const transactions = await WalletTransaction.getByUserId(userId, limit, offset);
    const count = await WalletTransaction.getTransactionCount(userId);

    return {
      transactions: transactions,
      total: count,
      page: page,
      pages: Math.ceil(count / limit),
    };
  }
}

module.exports = WalletService;