const { artistAccess } = require('../middleware/artistAccess');
const router = require('express').Router();
const ctrl = require('../controllers/contactController');
const auth = require('../middleware/auth');

router.get('/', auth, artistAccess, ctrl.getSubmissions);

module.exports = router;