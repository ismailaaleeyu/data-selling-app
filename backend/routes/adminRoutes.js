const express = require('express');

const AdminController =
    require('../controllers/adminController');

const db = require('../config/database');

const adminAuth =
    require('../middleware/adminAuth');

const router = express.Router();


// ==================================================
// PROTECTED ADMIN ROOT ROUTE
// ==================================================

router.get('/', adminAuth, (req, res) => {

    res.json({
        success: true,
        message: 'Admin API is working',
        admin: req.admin || null
    });

});


// ==================================================
// PUBLIC ADMIN ROUTES
// ==================================================

router.get('/test', (req, res) => {

    res.json({
        success: true,
        message: 'Admin API is working'
    });

});

router.post(
    '/login',
    AdminController.login
);


// ==================================================
// PROTECTED ADMIN ROUTES
// ==================================================

router.get(
    '/dashboard',
    adminAuth,
    AdminController.dashboard
);

router.get(
    '/users',
    adminAuth,
    AdminController.getUsers
);

router.get(
    '/wallet-transactions',
    adminAuth,
    AdminController.getWalletTransactions
);

router.get(
    '/data-transactions',
    adminAuth,
    AdminController.getDataTransactions
);

router.get(
    '/airtime-transactions',
    adminAuth,
    AdminController.getAirtimeTransactions
);

router.get(
    '/utility-transactions',
    adminAuth,
    AdminController.getUtilityTransactions
);

// POST /api/admin/refund-transaction
router.post('/refund-transaction', adminAuth, async (req, res) => {
    const { transactionId, type } = req.body; // type: 'data', 'airtime', 'utility'

    if (!transactionId || !type) {
        return res.status(400).json({ success: false, message: 'Transaction ID and type are required' });
    }

    // Map allowed transaction types to their respective SQL tables
    const tableMap = {
        'data': 'data_transactions',
        'airtime': 'airtime_transactions',
        'utility': 'utility_transactions'
    };

    const tableName = tableMap[type];
    if (!tableName) {
        return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }

    try {
        // 1. Fetch transaction details from the target table
        const queryResult = await db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [transactionId]);
        const rows = Array.isArray(queryResult[0]) ? queryResult[0] : queryResult;
        const txn = rows[0];

        if (!txn) {
            return res.status(404).json({ success: false, message: 'Transaction record not found' });
        }

        const status = String(txn.status || '').toLowerCase();

        // 2. Reject completed or already refunded orders
        if (status === 'completed' || status === 'success') {
            return res.status(400).json({ success: false, message: 'Cannot refund a completed transaction' });
        }

        if (status === 'refunded') {
            return res.status(400).json({ success: false, message: 'Transaction has already been refunded' });
        }

        // 3. Credit the user's wallet balance
        await db.query('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [txn.amount, txn.user_id]);

        // 4. Update transaction status to refunded in the corresponding table
        await db.query(`UPDATE ${tableName} SET status = "refunded" WHERE id = ?`, [transactionId]);

        return res.json({ 
            success: true, 
            message: `Successfully refunded ₦${txn.amount} to user balance.` 
        });
    } catch (error) {
        console.error('Refund Server Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error occurred during refund processing' 
        });
    }
});
module.exports = router;