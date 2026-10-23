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
const billingController = require('../controllers/billingController');
const rateLimit = require('../middleware/authRateLimit');
router.post('/portal', rateLimit(10, 60000, 'billing-portal'), billingController.createPortal);
router.post('/renew', rateLimit(10, 60000, 'billing-renew'), billingController.renewSubscription);
router.get('/status', billingController.getBillingStatus);
router.get('/invoices/:id/document', billingController.getInvoiceDocument);

module.exports = router;
