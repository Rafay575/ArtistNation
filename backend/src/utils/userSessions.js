const jwt = require('jsonwebtoken');
const { randomBytes, createHash } = require('crypto');
const pool = require('../config/db');
const { matchesVersion } = require('./fanTokens');
const { createHmac } = require('crypto');
const sessionId = nonce => createHash('sha256').update(nonce).digest('hex');

async function issueUserToken(user) {
  const nonce = randomBytes(32).toString('hex');
  const token = jwt.sign({
    id: user.id, role: 'artist', purpose: 'access', jti: nonce,
    version: createHmac('sha256', process.env.JWT_SECRET).update(user.password_hash).digest('hex'),
  }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '7d' });
  await pool.query('INSERT INTO auth_sessions (id, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))', [sessionId(nonce), user.id]);
  return token;
}

async function authenticateToken(token) {
  const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  if (decoded.role !== 'artist' || decoded.purpose !== 'access' || !Number.isInteger(decoded.id)
    || typeof decoded.jti !== 'string' || !/^[a-f0-9]{64}$/.test(decoded.jti)) return null;
  const [rows] = await pool.query('SELECT u.* FROM users u JOIN auth_sessions s ON s.user_id = u.id WHERE u.id = ? AND s.id = ? AND s.revoked_at IS NULL AND s.expires_at > NOW()', [decoded.id, sessionId(decoded.jti)]);
  const user = rows[0];
  if (!user || !user.is_verified || !matchesVersion(decoded.version, user.password_hash)) return null;
  return { user, sessionId: sessionId(decoded.jti) };
}

async function revokeSession(id) {
  await pool.query('UPDATE auth_sessions SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL', [id]);
}

module.exports = { issueUserToken, authenticateToken, revokeSession };
