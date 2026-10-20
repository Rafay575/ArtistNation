// middleware/requireAdmin.js
//
// Runs AFTER middleware/auth.js (which sets req.user = decoded JWT).
// Your JWT payload doesn't carry is_admin, so this looks it up fresh from
// the DB on every request — slightly slower than trusting the token, but
// means revoking admin access takes effect immediately instead of waiting
// for the token to expire.
const pool = require('../config/db');

module.exports = async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const [rows] = await pool.execute(
      'SELECT is_admin FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rows.length || !rows[0].is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (err) {
    next(err);
  }
};