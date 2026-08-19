const pool = require('../config/database');

class AirtimeController {
  static async getProviders(req, res) {
    try {
      const [plans] = await pool.query(
        `SELECT DISTINCT provider FROM airtime_plans WHERE active = TRUE`,
      );

      res.json({ success: true, providers: plans.map(p => p.provider) });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch providers' });
    }
  }

  static async getPlans(req, res) {
    const { provider } = req.query;

    try {
      let query = 'SELECT * FROM airtime_plans WHERE active = TRUE';
      const params = [];

      if (provider) {
        query += ' AND provider = ?';
        params.push(provider);
      }

      const [plans] = await pool.query(query, params);
      res.json({ success: true, plans });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to fetch plans' });
    }
  }

  static async buyAirtime(req, res) {
    const { phone_number, plan_id } = req.body;
    const connection = await pool.getConnection();

    try {
      // Get plan details
      const [plans] = await connection.execute(
        'SELECT * FROM airtime_plans WHERE id = ?',
        [plan_id]
      );

      if (plans.length === 0) {
        return res.status(404).json({ success: false, message: 'Plan not found' });
      }

      const plan = plans[0];

      // Check user balance
      const [users] = await connection.execute(
        'SELECT wallet_balance FROM users WHERE id = ?',
        [req.userId]
      );

      if (parseFloat(users[0].wallet_balance) < parseFloat(plan.amount)) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
      }

      await connection.beginTransaction();

      // Debit wallet
      await connection.execute(
        'UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?',
        [plan.amount, req.userId]
      );

      // Record transaction
      const reference = `AIR-${Date.now()}`;
      await connection.execute(
        `INSERT INTO airtime_transactions (user_id, phone_number, plan_id, amount, status, reference)
         VALUES (?, ?, ?, ?, 'completed', ?)`,
        [req.userId, phone_number, plan_id, plan.amount, reference]
      );

      // Log wallet transaction
      await connection.execute(
        `INSERT INTO wallet_transactions (user_id, amount, type, description, status)
         VALUES (?, ?, 'debit', ?, 'completed')`,
        [req.userId, plan.amount, `Airtime: ${plan.amount}N to ${phone_number}`]
      );

      await connection.commit();

      res.json({ 
        success: true, 
        message: 'Airtime purchased successfully',
        reference,
        amount: plan.amount
      });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ success: false, message: 'Purchase failed' });
    } finally {
      connection.release();
    }
  }
}

module.exports = AirtimeController;
