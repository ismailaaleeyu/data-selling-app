const express = require('express');
const UtilityController = require('../controllers/utilityController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/types', UtilityController.getUtilityTypes);
router.post('/pay', authMiddleware, UtilityController.payBill);
router.get('/history', authMiddleware, UtilityController.getBillHistory);

module.exports = router;
