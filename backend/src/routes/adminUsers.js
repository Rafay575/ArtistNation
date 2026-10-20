const express = require('express');
const router = express.Router();
const adminUsersController = require('../controllers/adminUsersController');
const requireAdmin = require('../middleware/requireAdmin');
const auth = require('../middleware/auth');

// Apply auth and requireAdmin middleware to all routes in this router
router.use(auth);
router.use(requireAdmin);
// GET /api/admin/users - list all users with business & subscription details
router.get('/',adminUsersController.getAllUsers);
router.get('/:id', adminUsersController.getUserById);
module.exports = router;