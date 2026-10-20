const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { getPaymentStats, getPayments } = require('../controllers/adminPaymentController');

router.get('/payments/stats', authenticateUser, requireAdmin, getPaymentStats);
router.get('/payments', authenticateUser, requireAdmin, getPayments);

module.exports = router;