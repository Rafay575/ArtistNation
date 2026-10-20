const router = require('express').Router();
const ctrl = require('../controllers/fanOrderController');
const fanAuth = require('../middleware/fanAuth');

router.get('/', fanAuth, ctrl.getMyOrders);

module.exports = router;