const { artistAccess } = require('../middleware/artistAccess');
const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const auth = require('../middleware/auth');

router.use(auth);
router.use(artistAccess);
router.get('/', ctrl.getOrders);
router.put('/:orderId/status', ctrl.updateOrderStatus);

module.exports = router;