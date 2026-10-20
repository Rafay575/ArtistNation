const router = require('express').Router();
const ctrl = require('../controllers/pickupLocationController');

router.get('/:subdomain', ctrl.getPublicLocations);

module.exports = router;