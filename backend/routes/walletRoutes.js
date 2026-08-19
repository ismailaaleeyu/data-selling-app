const express = require('express');

const WalletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get(
  '/balance',
  authMiddleware,
  WalletController.getBalance
);

router.get(
  '/transactions',
  authMiddleware,
  WalletController.getTransactions
);

module.exports = router;