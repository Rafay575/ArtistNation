// routes/profileRoutes.js
const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profileController');

// All profile routes are protected – require authentication
router.get('/', authMiddleware, getProfile);
router.put('/', authMiddleware, updateProfile);

module.exports = router;