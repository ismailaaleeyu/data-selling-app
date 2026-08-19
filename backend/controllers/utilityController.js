const pool = require('../config/database');

class UtilityController {
  static async getUtilityTypes(req, res) {
    try {
      const [types] = await pool.query(
        'SELECT * FROM utility_types WHERE active = TRUE'
      );

      res.json({ success: true, types });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch utility types' });
    }
  }

  static async payBill(req, res) {
    const { utility_type_id, utility_account_number, amount, account_number } = req.body;
    const accountNum = utility_account_number || account_number;
    const connection = await pool.getConnection();

    try {
      if (amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
      }

      // Verify utility type exists
      const [types] = await connection.execute(
        'SELECT * FROM utility_types WHERE id = ?',
        [utility_type_id]
      );

      if (types.length === 0) {
        return res.status(404).json({ success: false, message: 'Utility type not found' });
      }

      // Check user balance
      const [users] = await connection.execute(
        'SELECT wallet_balance FROM users WHERE id = ?',
        [req.userId]
      );

      if (parseFloat(users[0].wallet_balance) < parseFloat(amount)) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }

      await connection.beginTransaction();

      // Debit wallet
      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
        [amount, req.userId]
      );

      // Record utility bill payment
      const reference = `UTIL-${Date.now()}`;
      await connection.execute(
        `INSERT INTO utility_bills (user_id, utility_type_id, utility_account_number, amount, status, reference)
         VALUES (?, ?, ?, ?, 'completed', ?)`,
        [req.userId, utility_type_id, accountNum, amount, reference]
      );

      // Log wallet transaction
      await connection.execute(
        `INSERT INTO wallet_transactions (user_id, amount, type, description, status)
         VALUES (?, ?, 'debit', ?, 'completed')`,
        [req.userId, amount, `Utility Bill: ${types[0].name} - ${accountNum}`]
      );

      await connection.commit();

      res.json({ 
        success: true, 
        message: 'Bill paid successfully',
        reference,
        utility: types[0].name,
        amount
      });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ success: false, message: 'Payment failed' });
    } finally {
      connection.release();
    }
  }

  static async getBillHistory(req, res) {
    try {
      const [bills] = await pool.query(
        `SELECT ub.*, ut.name as utility_name 
         FROM utility_bills ub
         JOIN utility_types ut ON ub.utility_type_id = ut.id
         WHERE ub.user_id = ?
         ORDER BY ub.created_at DESC
         LIMIT 50`,
        [req.userId]
      );

      res.json({ success: true, bills });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch bill history' });
    }
  }
}

module.exports = UtilityController;
