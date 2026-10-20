// routes/mainWebsiteRoutes.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const upload = require('../config/multer');
const {
  getPublic,
  getAdmin,
  updateSection,
  replaceAll,
  updateVisibility,
  uploadImage,
} = require('../controllers/mainWebsiteController');

// Public — no auth. Landing page frontend calls this.
// Hidden sections come back as null; navbar/footer are always present.
router.get('/', getPublic);

// Admin — auth.js verifies JWT, requireAdmin checks is_admin = 1 in DB.
router.get('/admin', auth, requireAdmin, getAdmin);
router.put('/admin', auth, requireAdmin, replaceAll);
router.patch('/admin/:section', auth, requireAdmin, updateSection);

// Show/hide toggle — any section except navbar/footer (enforced in controller).
router.patch('/admin/visibility/:section', auth, requireAdmin, updateVisibility);

router.post('/admin/upload', auth, requireAdmin, upload.single('image'), uploadImage);

module.exports = router;