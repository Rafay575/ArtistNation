// routes/billingRoutes.js
const express = require('express');
const router = express.Router();
const {
  getBillingOverview,
  getInvoiceHistory,
  cancelSubscription,
  reactivateSubscription,
} = require('../controllers/billingController');

// Default import – no curly braces
const authenticateUser = require('../middleware/auth');

// All routes require authentication
router.use(authenticateUser);

// Routes
router.get('/overview', getBillingOverview);
router.get('/invoices', getInvoiceHistory);
router.post('/cancel', cancelSubscription);
router.post('/reactivate', reactivateSubscription);

module.exports = router;