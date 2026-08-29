const pool = require('../config/database');
const vtpassService = require('../services/vtpassService');

class DataController {

  // ==========================================
  // GET PROVIDERS
  // ==========================================
  static async getProviders(req, res) {
    try {
      const [plans] = await pool.query(
        `SELECT DISTINCT provider
         FROM data_plans
         WHERE active = TRUE
         ORDER BY provider`
      );

      res.json({
        success: true,
        providers: plans.map(p => p.provider)
      });

    } catch (error) {
      console.error('Get providers error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch providers'
      });
    }
  }


// ==========================================
// GET DATA PLANS
// ==========================================
static async getPlans(req, res) {
  const { provider } = req.query;

  try {
    let query = `
      SELECT *
      FROM data_plans
      WHERE active = TRUE
      AND service_id IS NOT NULL
      AND variation_code IS NOT NULL
    `;

    const params = [];

    if (provider) {
      query += ` AND provider = ?`;
      params.push(provider);
    }

    query += ` ORDER BY price ASC`;

    const [plans] = await pool.query(query, params);

    res.json({
      success: true,
      plans
    });

  } catch (error) {
    console.error('Get plans error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans'
    });
  }
}
  // ==========================================
  // BUY DATA
  // ==========================================
  static async buyData(req, res) {

    const { phone_number, plan_id } = req.body;

    if (!phone_number || !plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and plan are required'
      });
    }

    const connection = await pool.getConnection();

    let transactionId = null;
    let reference = null;

    try {

      // ==========================================
      // 1. GET PLAN
      // ==========================================
      const [plans] = await connection.execute(
        `SELECT *
         FROM data_plans
         WHERE id = ?
         AND active = TRUE`,
        [plan_id]
      );

      if (plans.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Data plan not found'
        });
      }

      const plan = plans[0];


      // ==========================================
      // 2. CHECK VTPASS CONFIGURATION
      // ==========================================
      if (!plan.service_id || !plan.variation_code) {
        return res.status(400).json({
          success: false,
          message: 'This data plan is not configured for VTpass'
        });
      }


      const planPrice = parseFloat(plan.price);


      // ==========================================
      // 3. START DATABASE TRANSACTION
      // ==========================================
      await connection.beginTransaction();


      // ==========================================
      // 4. LOCK USER WALLET
      // ==========================================
      const [users] = await connection.execute(
        `SELECT wallet_balance
         FROM users
         WHERE id = ?
         FOR UPDATE`,
        [req.userId]
      );

      if (users.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }


      const walletBalance = parseFloat(users[0].wallet_balance);


      // ==========================================
      // 5. CHECK BALANCE
      // ==========================================
      if (walletBalance < planPrice) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance',
          balance: walletBalance,
          required: planPrice
        });
      }


      // ==========================================
      // 6. CREATE INTERNAL REFERENCE
      // ==========================================
      reference = `DATA-${Date.now()}-${req.userId}`;


      // ==========================================
      // 7. CREATE PENDING TRANSACTION
      // ==========================================
      const [transactionResult] = await connection.execute(
        `INSERT INTO data_transactions
        (
          user_id,
          phone_number,
          plan_id,
          amount,
          status,
          reference
        )
        VALUES (?, ?, ?, ?, 'pending', ?)`,
        [
          req.userId,
          phone_number,
          plan_id,
          planPrice,
          reference
        ]
      );

      transactionId = transactionResult.insertId;


      // ==========================================
      // 8. COMMIT PENDING TRANSACTION
      // ==========================================
      await connection.commit();


      // ==========================================
      // 9. CALL VTPASS
      // ==========================================
      console.log('\n========== BUYING DATA FROM VTPASS ==========');

      const vtpassResult = await vtpassService.buyData({
        serviceID: plan.service_id,
        phone: phone_number,
        variation_code: plan.variation_code,
        amount: planPrice
      });


      // ==========================================
      // 10. GET VTPASS DETAILS
      // ==========================================
      const vtpassStatus =
        vtpassResult?.content?.transactions?.status;

      const vtpassRequestId =
        vtpassResult?.requestId ||
        vtpassResult?.request_id;

      const vtpassTransactionId =
        vtpassResult?.content?.transactions?.transactionId;


      console.log('\n========== VTPASS RESULT ==========');
      console.log(JSON.stringify(vtpassResult, null, 2));


      // ==========================================
      // 11. VTPASS SUCCESS
      // ==========================================
      if (
        vtpassResult?.code === '000' &&
        vtpassStatus === 'delivered'
      ) {

        await connection.beginTransaction();


        // ------------------------------------------
        // Debit wallet
        // ------------------------------------------
        const [debitResult] = await connection.execute(
          `UPDATE users
           SET wallet_balance = wallet_balance - ?
           WHERE id = ?
           AND wallet_balance >= ?`,
          [
            planPrice,
            req.userId,
            planPrice
          ]
        );


        if (debitResult.affectedRows !== 1) {
          await connection.rollback();

          throw new Error(
            'Unable to debit wallet'
          );
        }


        // ------------------------------------------
        // Update data transaction
        // ------------------------------------------
        await connection.execute(
          `UPDATE data_transactions
           SET status = 'completed',
               vtpass_request_id = ?,
               vtpass_transaction_id = ?
           WHERE id = ?`,
          [
            vtpassRequestId || null,
            vtpassTransactionId || null,
            transactionId
          ]
        );


        // ------------------------------------------
        // Wallet transaction reference
        // ------------------------------------------
        const walletReference =
          `WALLET-DATA-${transactionId}`;


        // ------------------------------------------
        // Log wallet debit
        // ------------------------------------------
        await connection.execute(
          `INSERT INTO wallet_transactions
          (
            user_id,
            amount,
            type,
            description,
            status,
            reference
          )
          VALUES (?, ?, 'debit', ?, 'completed', ?)`,
          [
            req.userId,
            planPrice,
            `Data: ${plan.name} to ${phone_number}`,
            walletReference
          ]
        );


        await connection.commit();


        // ------------------------------------------
        // Get new wallet balance
        // ------------------------------------------
        const [updatedUsers] = await connection.execute(
          `SELECT wallet_balance
           FROM users
           WHERE id = ?`,
          [req.userId]
        );


        return res.json({
          success: true,
          message: 'Data purchased successfully',
          reference,
          vtpass_request_id: vtpassRequestId,
          vtpass_transaction_id: vtpassTransactionId,
          plan: plan.name,
          phone_number,
          amount: planPrice,
          status: 'completed',
          wallet_balance: updatedUsers[0].wallet_balance
        });
      }


      // ==========================================
      // 12. VTPASS FAILED
      // ==========================================
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE data_transactions
         SET status = 'failed',
             vtpass_request_id = ?,
             vtpass_transaction_id = ?
         WHERE id = ?`,
        [
          vtpassRequestId || null,
          vtpassTransactionId || null,
          transactionId
        ]
      );

      await connection.commit();


      return res.status(400).json({
        success: false,
        message:
          vtpassResult?.response_description ||
          'Data purchase failed',
        reference,
        status: 'failed'
      });


    } catch (error) {

      console.error('\n========== DATA PURCHASE ERROR ==========');
      console.error(error);


      // Rollback if a transaction is still active
      try {
        await connection.rollback();
      } catch (rollbackError) {
        // Ignore rollback error when no transaction is active
      }


      // Mark our pending transaction as failed
      if (transactionId) {
        try {
          await connection.execute(
            `UPDATE data_transactions
             SET status = 'failed'
             WHERE id = ?
             AND status = 'pending'`,
            [transactionId]
          );
        } catch (updateError) {
          console.error(
            'Failed to update transaction status:',
            updateError
          );
        }
      }


      return res.status(500).json({
        success: false,
        message: error.message || 'Data purchase failed',
        reference
      });

    } finally {
      connection.release();
    }
  }
}

module.exports = DataController;