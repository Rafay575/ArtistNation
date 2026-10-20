const { artistAccess } = require('../middleware/artistAccess');
const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { getArtistFans } = require('../controllers/fanController');

router.get('/fans', authMiddleware, artistAccess, getArtistFans);

module.exports = router;