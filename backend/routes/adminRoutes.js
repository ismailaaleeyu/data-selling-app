const express = require('express');

const AdminController =
  require('../controllers/adminController');

const adminAuth =
  require('../middleware/adminAuth');

const router = express.Router();


// ==========================================
// ADMIN LOGIN
// ==========================================

router.post(
  '/login',
  AdminController.login
);


// ==========================================
// TEST PROTECTED ADMIN ROUTE
// ==========================================

router.get(
  '/verify',
  adminAuth,
  (req, res) => {

    res.json({
      success: true,
      message: 'Admin authentication successful',
      admin: {
        id: req.adminId,
        email: req.adminEmail,
        role: req.adminRole
      }
    });

  }
);


module.exports = router;
