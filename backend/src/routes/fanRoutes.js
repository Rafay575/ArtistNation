const router = require('express').Router();
const ctrl = require('../controllers/fanController');
const fanAuth = require('../middleware/fanAuth');
const validate = require('../middleware/fanRequestValidation');
const rateLimit = require('../middleware/fanRateLimit');
const loginLimit = rateLimit(15, 15 * 60 * 1000);
const otpLimit = rateLimit(15, 15 * 60 * 1000);
const emailLimit = rateLimit(5, 15 * 60 * 1000);

router.post('/:subdomain/register', emailLimit, validate('register'), ctrl.registerFan);
router.post('/:subdomain/verify-otp', otpLimit, validate('otp'), ctrl.verifyFanOTP);
router.post('/:subdomain/resend-otp', emailLimit, validate('email'), ctrl.resendFanOTP);
router.post('/:subdomain/login', loginLimit, validate('login'), ctrl.loginFan);
router.post('/:subdomain/forgot-password', emailLimit, validate('email'), ctrl.forgotFanPassword);
router.post('/:subdomain/verify-reset-otp', otpLimit, validate('otp'), ctrl.verifyFanResetOTP);
router.post('/:subdomain/reset-password', otpLimit, validate('reset'), ctrl.resetFanPassword);
router.get('/profile', fanAuth, ctrl.getFanProfile);
module.exports = router;
