const { createHmac, createHash, randomBytes, timingSafeEqual } = require('crypto');
const jwt = require('jsonwebtoken');

function passwordVersion(passwordHash) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
  return createHmac('sha256', process.env.JWT_SECRET).update(passwordHash).digest('hex');
}

function issueFanToken(fan) {
  return jwt.sign({
    id: fan.id, email: fan.email, artistId: fan.artist_id,
    role: 'fan', purpose: 'fan-access', version: passwordVersion(fan.password_hash),
  }, process.env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
}

function matchesVersion(version, passwordHash) {
  if (typeof version !== 'string' || !/^[a-f0-9]{64}$/.test(version)) return false;
  return timingSafeEqual(Buffer.from(version, 'hex'), Buffer.from(passwordVersion(passwordHash), 'hex'));
}

function resetGrantHash(nonce) {
  return 'grant:' + createHash('sha256').update(nonce).digest('hex');
}

module.exports = { issueFanToken, matchesVersion, resetGrantHash, newResetNonce: () => randomBytes(32).toString('hex') };
