const { artistAccess } = require('../middleware/artistAccess');
const router = require('express').Router();
const ctrl = require('../controllers/pickupLocationController');
const auth = require('../middleware/auth');

router.use(auth);
router.use(artistAccess);
router.get('/', ctrl.getLocations);
router.post('/', ctrl.createLocation);
router.put('/:locationId', ctrl.updateLocation);
router.delete('/:locationId', ctrl.deleteLocation);

module.exports = router;