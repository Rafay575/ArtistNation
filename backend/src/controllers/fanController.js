const fanModel = require('../models/fan');
const { findBusinessBySubdomain } = require('../models/business');
const { findUserById } = require('../models/user');
const { sendFanOTPEmail } = require('../utils/mailer');
const { issueFanToken } = require('../utils/fanTokens');
const { siteUrl } = require('../utils/onboardingValidation');
const { randomInt, randomBytes } = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Equal-cost password comparison for unknown accounts avoids the obvious fast path.
const dummyPasswordHash = bcrypt.hash(randomBytes(32).toString('hex'), 10);
const resetMessage = 'If your email is registered, you will receive a reset code.';

async function getArtistBySubdomain(subdomain) {
    const business = await findBusinessBySubdomain(subdomain);
    if (!business || !business.is_active) return null;
    return findUserById(business.user_id);
}

async function deliverOTP(fan, purpose, subdomain) {
    const otp = randomInt(100000, 1000000).toString();
    const hash = await fanModel.setOTP(fan.id, otp, purpose);
    try {
        await sendFanOTPEmail(fan.email, fan.full_name, otp, purpose, { siteUrl: siteUrl({ subdomain }) });
    } catch (error) {
        await fanModel.clearUndeliveredOTP(fan.id, purpose, hash).catch(() => {});
        console.error('Fan OTP email delivery failed:', error.code || 'SMTP_ERROR');
        const failure = new Error('We could not send the code. Please try again shortly.');
        failure.status = 503;
        throw failure;
    }
}

function handleFailure(error, res, next) {
    if (error.status === 503) return res.status(503).json({ error: error.message });
    return next(error);
}

function authResponse(res, fan, verified = !!fan.is_verified) {
    return res.json({
        message: verified ? 'Authentication successful' : 'Email verification required',
        token: issueFanToken(fan),
        fan: { id: fan.id, email: fan.email, fullName: fan.full_name, isVerified: verified },
    });
}

async function registerFan(req, res, next) {
    try {
        const { fullName, email, password } = req.body;
        const artist = await getArtistBySubdomain(req.params.subdomain);
        if (!artist) return res.status(404).json({ error: 'Artist not found' });
        const existing = await fanModel.findFanByEmail(artist.id, email);
        let fan;
        if (existing) {
            // A failed email must not strand an account; retry requires its password.
            if (existing.is_verified || !(await bcrypt.compare(password, existing.password_hash))) {
                return res.status(409).json({ error: 'Email already registered' });
            }
            fan = existing;
        } else {
            const fanId = await fanModel.createFan(artist.id, { fullName, email, password });
            fan = { id: fanId, email, full_name: fullName };
        }
        await deliverOTP(fan, 'verify', req.params.subdomain);
        return res.status(201).json({ message: 'Please verify your email with the code sent.', fanId: fan.id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
        return handleFailure(error, res, next);
    }
}

async function verifyFanOTP(req, res, next) {
    try {
        const artist = await getArtistBySubdomain(req.params.subdomain);
        if (!artist) return res.status(404).json({ error: 'Artist not found' });
        const fan = await fanModel.findFanByEmail(artist.id, req.body.email);
        if (!fan || !(await fanModel.verifyAndMarkEmail(fan.id, req.body.otp))) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        // Re-read after verification so a concurrent reset cannot issue a stale session.
        return authResponse(res, await fanModel.findFanAuthById(fan.id), true);
    } catch (error) { next(error); }
}

async function resendFanOTP(req, res, next) {
    try {
        const artist = await getArtistBySubdomain(req.params.subdomain);
        if (!artist) return res.status(404).json({ error: 'Artist not found' });
        const fan = await fanModel.findFanByEmail(artist.id, req.body.email);
        if (!fan || fan.is_verified) return res.status(400).json({ error: 'Unable to resend verification code for this account' });
        await deliverOTP(fan, 'verify', req.params.subdomain);
        return res.json({ message: 'Verification code sent.' });
    } catch (error) { return handleFailure(error, res, next); }
}

async function loginFan(req, res, next) {
    try {
        const { email, password } = req.body;
        const artist = await getArtistBySubdomain(req.params.subdomain);
        if (!artist) return res.status(404).json({ error: 'Artist not found' });
        const fan = await fanModel.findFanByEmail(artist.id, email);
        const valid = await bcrypt.compare(password, fan?.password_hash || await dummyPasswordHash);
        if (!fan || !valid) return res.status(401).json({ error: 'Invalid credentials' });
        if (!fan.is_verified) return res.status(403).json({ error: 'Please verify your email first' });
        return authResponse(res, fan);
    } catch (error) { next(error); }
}

async function forgotFanPassword(req, res, next) {
    try {
        const artist = await getArtistBySubdomain(req.params.subdomain);
        if (!artist) return res.status(404).json({ error: 'Artist not found' });
        const fan = await fanModel.findFanByEmail(artist.id, req.body.email);
        if (fan) await deliverOTP(fan, 'reset', req.params.subdomain);
        return res.json({ message: resetMessage });
    } catch (error) { return handleFailure(error, res, next); }
}

async function verifyFanResetOTP(req, res, next) {
    try {
        const artist = await getArtistBySubdomain(req.params.subdomain);
        if (!artist) return res.status(404).json({ error: 'Artist not found' });
        const fan = await fanModel.findFanByEmail(artist.id, req.body.email);
        const nonce = fan ? await fanModel.exchangeResetOTP(fan.id, req.body.otp) : null;
        if (!nonce) return res.status(400).json({ error: 'Invalid or expired OTP' });
        const resetToken = jwt.sign({
            id: fan.id, artistId: artist.id, role: 'fan', purpose: 'reset-password', jti: nonce,
        }, process.env.JWT_SECRET, { expiresIn: '10m', algorithm: 'HS256' });
        return res.json({ message: 'OTP verified', resetToken });
    } catch (error) { next(error); }
}

async function resetFanPassword(req, res, next) {
    try {
        const { resetToken, newPassword } = req.body;
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        if (decoded.role !== 'fan' || decoded.purpose !== 'reset-password'
            || !Number.isInteger(decoded.id) || !Number.isInteger(decoded.artistId)
            || typeof decoded.jti !== 'string' || !/^[a-f0-9]{64}$/.test(decoded.jti)) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        const artist = await getArtistBySubdomain(req.params.subdomain);
        if (!artist || artist.id !== decoded.artistId) return res.status(400).json({ error: 'Invalid or expired reset token' });
        const changed = await fanModel.consumeResetGrant(decoded.id, artist.id, decoded.jti, newPassword);
        if (!changed) return res.status(400).json({ error: 'Invalid or expired reset token' });
        return res.json({ message: 'Password reset successfully. Please sign in with your new password.' });
    } catch (error) {
        if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        next(error);
    }
}

async function getFanProfile(req, res, next) {
    try {
        const fan = await fanModel.findFanById(req.fan.id);
        if (!fan) return res.status(404).json({ error: 'Fan not found' });
        return res.json(fan);
    } catch (error) { next(error); }
}

async function getArtistFans(req, res, next) {
    try { res.json(await fanModel.getFansByArtist(req.user.id)); }
    catch (error) { next(error); }
}

module.exports = { registerFan, verifyFanOTP, resendFanOTP, loginFan, forgotFanPassword, verifyFanResetOTP, resetFanPassword, getFanProfile, getArtistFans };
