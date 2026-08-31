const express = require('express');

const AdminController =
    require('../controllers/adminController');

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

module.exports = router;
