const express = require('express');
const router = express.Router();
const { handleStripeWebhook } = require('../controllers/webhookController');

// CRITICAL: raw body for webhook signature verification
// express.json() must NOT parse this route
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

module.exports = router;