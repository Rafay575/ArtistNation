const { createHash } = require('crypto');
const pool = require('../config/db');
// Database-backed buckets keep limits effective across restarts and API workers.
module.exports = function authRateLimit(limit, windowMs, scope = String(limit)) {
  let requests = 0;
  return async (req, res, next) => {
    try {
      const account = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 255)
        : Number.isInteger(req.body?.userId) ? `id:${req.body.userId}` : null;
      const buckets = [[`ip:${req.ip}`, limit * 10]];
      if (account) buckets.push([`account:${account}`, limit]);
      for (const [key, max] of buckets) {
        const id = createHash('sha256').update(`${scope}:${key}`).digest('hex');
        await pool.query(`INSERT INTO auth_rate_limits (id, attempts, reset_at) VALUES (?, 1, TIMESTAMPADD(SECOND, ?, NOW()))
          ON DUPLICATE KEY UPDATE attempts = IF(reset_at <= NOW(), 1, attempts + 1),
          reset_at = IF(reset_at <= NOW(), VALUES(reset_at), reset_at)`, [id, Math.ceil(windowMs / 1000)]);
        const [rows] = await pool.query('SELECT attempts, TIMESTAMPDIFF(SECOND, NOW(), reset_at) AS retry_after FROM auth_rate_limits WHERE id = ?', [id]);
        if (rows[0].attempts > max) {
          res.set('Retry-After', String(Math.max(1, rows[0].retry_after)));
          return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
        }
      }
      if (++requests % 100 === 0) await pool.query('DELETE FROM auth_rate_limits WHERE reset_at < DATE_SUB(NOW(), INTERVAL 1 DAY)');
      next();
    } catch (error) { next(error); }
  };
};
