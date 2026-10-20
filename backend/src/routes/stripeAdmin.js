const { artistAccess } = require('../middleware/artistAccess');
const router = require('express').Router();
const stripeController = require('../controllers/stripeController');
const authMiddleware = require('../middleware/auth'); // your admin auth

router.use(authMiddleware);
router.use(artistAccess);
router.post('/connect/onboard', stripeController.createConnectAccountLink);
router.get('/connect/status', stripeController.getConnectStatus);

module.exports = router;