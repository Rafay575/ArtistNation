// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/auth');
const { artistAccess } = require('../middleware/artistAccess');
const { getDashboardStats } = require('../controllers/dashboardController');

router.get('/stats', authenticateUser, artistAccess, getDashboardStats);

module.exports = router;