const pool = require('../config/database');

class WalletController {
  static async getBalance(req, res) {
    try {
      const [users] = await pool.query(
        'SELECT wallet_balance FROM users WHERE id = ?',
        [req.userId]
      );

      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ 
        success: true, 
        balance: users[0].wallet_balance 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch balance' });
    }
  }

  static async fundWallet(req, res) {
    const { amount } = req.body;
    const connection = await pool.getConnection();

    try {
      if (amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
      }

      await connection.beginTransaction();

      // Update wallet
      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
        [amount, req.userId]
      );

      // Log transaction
      await connection.execute(
        `INSERT INTO wallet_transactions (user_id, amount, type, description, status)
         VALUES (?, ?, 'credit', 'Wallet Fund', 'completed')`,
        [req.userId, amount]
      );

      await connection.commit();

      res.json({ 
        success: true, 
        message: 'Wallet funded successfully' 
      });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ success: false, message: 'Transaction failed' });
    } finally {
      connection.release();
    }
  }

  static async getTransactions(req, res) {
    try {
      const [transactions] = await pool.query(
        `SELECT * FROM wallet_transactions 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [req.userId]
      );

      res.json({ success: true, transactions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
    }
  }
}

module.exports = WalletController;
