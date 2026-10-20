const express = require('express');
const router = express.Router();
const { getExecutiveAnalytics } = require('../controllers/executiveDashboardController');
const authenticateUser = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

// Apply auth and requireAdmin middleware to all routes in this router
router.use(authenticateUser);
router.use(requireAdmin);
// ============================================================
// ADMIN: Get executive dashboard analytics
// GET /api/admin/executive/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// ============================================================

router.get('/analytics', getExecutiveAnalytics);

module.exports = router;