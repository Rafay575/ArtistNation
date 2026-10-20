const router = require('express').Router();
const stripeController = require('../controllers/stripeController');
const fanAuthMiddleware = require('../middleware/fanAuth'); // for fan JWT

router.post('/:subdomain/checkout', fanAuthMiddleware, stripeController.createPaymentIntent);
router.get('/:subdomain/stripe-status', stripeController.getPublicStripeStatus);
module.exports = router;