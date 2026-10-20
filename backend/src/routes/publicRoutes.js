const router = require('express').Router();
const { getArtistData, getArtistPage } = require('../controllers/publicController');

router.get('/:subdomain/data', getArtistData);
router.get('/:subdomain{/:slug}', getArtistPage); // 👈 now handles pages

module.exports = router;