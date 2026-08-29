const pool = require('../config/database');
const AirtimeService = require('../services/airtimeService');

class AirtimeController {

  // ==========================================
  // GET AIRTIME PROVIDERS
  // ==========================================
  static async getProviders(req, res) {
    try {
      const [plans] = await pool.query(
        `SELECT DISTINCT provider
         FROM airtime_plans
         WHERE active = TRUE
         ORDER BY provider`
      );

      res.json({
        success: true,
        providers: plans.map(plan => plan.provider)
      });

    } catch (error) {
      console.error(
        'Get airtime providers error:',
        error.message
      );

      res.status(500).json({
        success: false,
        message: 'Failed to fetch airtime providers'
      });
    }
  }


  // ==========================================
  // GET AIRTIME PLANS
  // ==========================================
  static async getPlans(req, res) {
    const { provider } = req.query;

    try {
      let query = `
        SELECT
          id,
          provider,
          amount,
          description
        FROM airtime_plans
        WHERE active = TRUE
      `;

      const params = [];

      if (provider) {
        query += ` AND provider = ?`;
        params.push(provider);
      }

      query += ` ORDER BY amount ASC`;

      const [plans] = await pool.query(
        query,
        params
      );

      res.json({
        success: true,
        plans
      });

    } catch (error) {
      console.error(
        'Get airtime plans error:',
        error.message
      );

      res.status(500).json({
        success: false,
        message: 'Failed to fetch airtime plans'
      });
    }
  }


  // ==========================================
  // BUY AIRTIME
  // ==========================================
  static async buyAirtime(req, res) {
    try {

      // Your auth middleware may expose either
      // req.user.id or req.userId.
      const userId =
        req.user?.id ||
        req.user?.userId ||
        req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const {
        phone_number,
        plan_id
      } = req.body;

      // ----------------------------------------
      // Validate request
      // ----------------------------------------
      if (!phone_number) {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required'
        });
      }

      if (!plan_id) {
        return res.status(400).json({
          success: false,
          message: 'Airtime plan is required'
        });
      }

      // ----------------------------------------
      // Purchase airtime
      // ----------------------------------------
      const result =
        await AirtimeService.buyAirtime(
          userId,
          phone_number,
          Number(plan_id)
        );

      return res.json(result);

    } catch (error) {

      console.error(
        'Buy airtime controller error:',
        error.message
      );

      // ----------------------------------------
      // Insufficient balance / validation errors
      // ----------------------------------------
      if (
        error.message ===
        'Insufficient wallet balance'
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (
        error.message.includes(
          'valid Nigerian phone number'
        )
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (
        error.message.includes(
          'not found'
        )
      ) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      // ----------------------------------------
      // Other errors
      // ----------------------------------------
      return res.status(500).json({
        success: false,
        message:
          error.message ||
          'Airtime purchase failed'
      });
    }
  }
}

module.exports = AirtimeController;