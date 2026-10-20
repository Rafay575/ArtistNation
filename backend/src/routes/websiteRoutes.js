const { artistAccess } = require('../middleware/artistAccess');
const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multer');
const {
    getSettingsHandler,
    updateSettingsHandler,
    getPages,
    getPage,
    createPage,
    updatePage,
    deletePage,
    addSection,
    updateSection,
    deleteSection,
    getMedia,
    uploadMediaHandler,
    deleteMedia,
    getAllSections,
    getSection,
} = require('../controllers/websiteController');

router.use(authMiddleware);
router.use(artistAccess);

// Settings (navbar/footer content lives here: siteName, primaryColor, logoUrl, faviconUrl, footerData)
router.get('/settings', getSettingsHandler);
router.put('/settings', updateSettingsHandler);

// Pages
router.get('/pages', getPages);
router.get('/pages/:slug', getPage);
router.post('/pages', createPage);
router.put('/pages/:pageId', updatePage);
router.delete('/pages/:pageId', deletePage);

// Sections
// IMPORTANT: '/sections/all' must be registered BEFORE '/sections/:id'.
// Express matches routes in order, so with the old ordering
// GET /sections/all was being swallowed by GET /sections/:id
// (with "all" treated as the id) and getAllSections never ran.
router.get('/sections/all', getAllSections);
router.get('/sections/:id', getSection);
router.post('/pages/:pageId/sections', addSection);
router.put('/sections/:sectionId', updateSection);
router.delete('/sections/:sectionId', deleteSection);

// Media
router.get('/media', getMedia);
router.post('/media', upload.single('file'), uploadMediaHandler);
router.delete('/media/:mediaId', deleteMedia);

module.exports = router;