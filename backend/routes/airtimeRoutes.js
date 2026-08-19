const express = require('express');
const AirtimeController = require('../controllers/airtimeController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/providers', AirtimeController.getProviders);
router.get('/plans', AirtimeController.getPlans);
router.post('/buy', authMiddleware, AirtimeController.buyAirtime);

module.exports = router;
