// routes/onboarding.js
const router = require('express').Router();
const { onboarding } = require('../controllers/authController');
const onboardedGuard = require('../middleware/onboardingGuard');
const authMiddleware = require('../middleware/auth'); // your JWT auth

router.get('/', authMiddleware, onboardedGuard, (req, res) => {
    // Serve the onboarding page (HTML or JSON with user data)
    res.json({ message: 'Onboarding page', userId: req.user.id });
});

router.post('/', authMiddleware, onboardedGuard, onboarding);

module.exports = router;