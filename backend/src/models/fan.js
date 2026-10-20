const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { resetGrantHash, newResetNonce } = require('../utils/fanTokens');

async function findFanByEmail(artistId, email) {
    const [rows] = await pool.query('SELECT * FROM fans WHERE artist_id = ? AND email = ?', [artistId, email]);
    return rows[0];
}

async function findFanById(fanId) {
    const [rows] = await pool.query('SELECT id, email, full_name, is_verified, created_at FROM fans WHERE id = ?', [fanId]);
    return rows[0];
}

async function findFanAuthById(fanId) {
    const [rows] = await pool.query('SELECT id, artist_id, email, password_hash, is_verified FROM fans WHERE id = ?', [fanId]);
    return rows[0];
}

async function createFan(artistId, { fullName, email, password }) {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
        `INSERT INTO fans (artist_id, email, full_name, password_hash)
         VALUES (?, ?, ?, ?)`,
        [artistId, email, fullName, hashed]
    );
    return result.insertId;
}

async function updateFan(fanId, data) {
    const fields = [];
    const values = [];
    if (data.fullName !== undefined) { fields.push('full_name = ?'); values.push(data.fullName); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.password !== undefined) {
        const hashed = await bcrypt.hash(data.password, 10);
        fields.push('password_hash = ?');
        values.push(hashed);
    }
    if (data.isVerified !== undefined) { fields.push('is_verified = ?'); values.push(data.isVerified); }
    if (data.emailVerifiedAt !== undefined) { fields.push('email_verified_at = ?'); values.push(data.emailVerifiedAt); }
    if (fields.length === 0) return;
    values.push(fanId);
    await pool.query(`UPDATE fans SET ${fields.join(', ')} WHERE id = ?`, values);
}

async function getFansByArtist(artistId) {
    const [rows] = await pool.query('SELECT id, email, full_name, is_verified, created_at FROM fans WHERE artist_id = ? ORDER BY created_at DESC', [artistId]);
    return rows;
}

// ---------- OTP management (used for verification and reset) ----------
async function setOTP(fanId, otp, type = 'verify') {
    const hashed = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    const field = type === 'verify' ? 'otp_hash' : 'reset_otp_hash';
    const expiryField = type === 'verify' ? 'otp_expires_at' : 'reset_otp_expires_at';
    await pool.query(
        `UPDATE fans SET ${field} = ?, ${expiryField} = ? WHERE id = ?`,
        [hashed, expiresAt, fanId]
    );
    return hashed;
}

async function readValidOTP(fanId, otp, type) {
    const field = type === 'verify' ? 'otp_hash' : 'reset_otp_hash';
    const expiryField = type === 'verify' ? 'otp_expires_at' : 'reset_otp_expires_at';
    const [rows] = await pool.query(`SELECT ${field} AS hash FROM fans WHERE id = ? AND ${expiryField} > NOW()`, [fanId]);
    const hash = rows[0]?.hash;
    // Reset grants share this column but must never be treated as bcrypt OTPs.
    if (!hash || !hash.startsWith('$2') || !(await bcrypt.compare(otp, hash))) return null;
    return { field, expiryField, hash };
}

async function verifyOTP(fanId, otp, type = 'verify') {
    const match = await readValidOTP(fanId, otp, type);
    if (!match) return false;
    const { field, expiryField, hash } = match;
    const [result] = await pool.query(`UPDATE fans SET ${field} = NULL, ${expiryField} = NULL WHERE id = ? AND ${field} = ? AND ${expiryField} > NOW()`, [fanId, hash]);
    return result.affectedRows === 1;
}

async function verifyAndMarkEmail(fanId, otp) {
    const match = await readValidOTP(fanId, otp, 'verify');
    if (!match) return false;
    const [result] = await pool.query('UPDATE fans SET is_verified = true, email_verified_at = NOW(), otp_hash = NULL, otp_expires_at = NULL WHERE id = ? AND otp_hash = ? AND otp_expires_at > NOW()', [fanId, match.hash]);
    return result.affectedRows === 1;
}

async function exchangeResetOTP(fanId, otp) {
    const match = await readValidOTP(fanId, otp, 'reset');
    if (!match) return null;
    const nonce = newResetNonce();
    const [result] = await pool.query('UPDATE fans SET reset_otp_hash = ?, reset_otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ? AND reset_otp_hash = ? AND reset_otp_expires_at > NOW()', [resetGrantHash(nonce), fanId, match.hash]);
    return result.affectedRows === 1 ? nonce : null;
}

async function consumeResetGrant(fanId, artistId, nonce, newPassword) {
    const hashed = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.query('UPDATE fans SET password_hash = ?, reset_otp_hash = NULL, reset_otp_expires_at = NULL WHERE id = ? AND artist_id = ? AND reset_otp_hash = ? AND reset_otp_expires_at > NOW()', [hashed, fanId, artistId, resetGrantHash(nonce)]);
    return result.affectedRows === 1;
}

async function clearUndeliveredOTP(fanId, type, hash) {
    const field = type === 'verify' ? 'otp_hash' : 'reset_otp_hash';
    const expiry = type === 'verify' ? 'otp_expires_at' : 'reset_otp_expires_at';
    await pool.query(`UPDATE fans SET ${field} = NULL, ${expiry} = NULL WHERE id = ? AND ${field} = ?`, [fanId, hash]);
}

module.exports = {
    findFanByEmail,
    findFanAuthById,
    exchangeResetOTP,
    consumeResetGrant,
    clearUndeliveredOTP,
    findFanById,
    createFan,
    updateFan,
    getFansByArtist,
    setOTP,
    verifyOTP,
    verifyAndMarkEmail,
};