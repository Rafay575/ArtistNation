const router = require('express').Router();
const stripeController = require('../controllers/stripeController');
const fanAuthMiddleware = require('../middleware/fanAuth'); // for fan JWT

const rateLimit = require('../middleware/authRateLimit');
router.post('/:subdomain/checkout', fanAuthMiddleware, rateLimit(10, 60000, 'store-checkout'), stripeController.createPaymentIntent);
router.post('/:subdomain/checkout/:sessionId/confirm', fanAuthMiddleware, rateLimit(20, 60000, 'store-confirm'), stripeController.confirmCheckout);
router.get('/:subdomain/stripe-status', stripeController.getPublicStripeStatus);
module.exports = router;
