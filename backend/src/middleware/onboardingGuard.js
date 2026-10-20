// middleware/onboardingGuard.js
const { findUserById } = require('../models/user');
const { findBusinessByUserId } = require('../models/business'); // ✅ add this

async function onboardedGuard(req, res, next) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.is_verified) {
        return res.status(403).json({ error: 'Please verify your email first.', redirect: '/signup' });
    }

    if (user.is_onboarded) {
        const business = await findBusinessByUserId(userId);
        return res.status(403).json({
            error: 'Already onboarded',
            redirect: "/admin/dashboard"
        });
    }

    next();
}

module.exports = onboardedGuard;