const express = require('express');
const DataController = require('../controllers/dataController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/providers', DataController.getProviders);
router.get('/plans', DataController.getPlans);
router.post('/buy', authMiddleware, DataController.buyData);

module.exports = router;
