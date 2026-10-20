const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/authValidation');
const rateLimit = require('../middleware/authRateLimit');
const { revokeSession } = require('../utils/userSessions');
const { hasSubscription } = require('../middleware/artistAccess');
const loginLimit = rateLimit(15, 15 * 60 * 1000);
const otpLimit = rateLimit(10, 15 * 60 * 1000);
const emailLimit = rateLimit(5, 15 * 60 * 1000);
const {
    // Auth
    login,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    // Signup & OTP
    signup,
    verifyOTPFunc,
    resendOTP,
    // Onboarding
    getOnboardingDraft,
    saveOnboardingDraft,
    completeOnboarding,
} = require('../controllers/authController');


// Auth
router.post('/login', loginLimit, validate('login'), login);
router.post('/forgot-password', emailLimit, validate('email'), forgotPassword);
router.post('/verify-reset-otp', otpLimit, validate('resetOTP'), verifyResetOTP);
router.post('/reset-password', otpLimit, validate('reset'), resetPassword);

// Signup
router.post('/signup', emailLimit, signup);
router.post('/verify-otp', otpLimit, validate('signupOTP'), verifyOTPFunc);
router.post('/resend-otp', emailLimit, validate('resend'), resendOTP);

// ---------- Protected routes (require authentication) ----------
router.get('/onboarding/draft', authMiddleware, getOnboardingDraft);
router.post('/onboarding/draft', authMiddleware, saveOnboardingDraft);
router.post('/onboarding/complete', authMiddleware, completeOnboarding);

router.get('/session', authMiddleware, async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json({ user: { ...req.user, canManage: req.user.isAdmin || (req.user.isOnboarded && await hasSubscription(req.user.id)) } });
  } catch (error) { next(error); }
});
router.post('/logout', authMiddleware, async (req, res, next) => {
  try { await revokeSession(req.sessionId); res.json({ message: 'Signed out' }); }
  catch (error) { next(error); }
});
module.exports = router;