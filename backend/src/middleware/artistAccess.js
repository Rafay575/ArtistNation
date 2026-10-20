const pool = require('../config/db');

async function hasSubscription(userId) {
  const [rows] = await pool.query(`SELECT u.trial_end_date, u.is_trial_expired, b.is_active,
    EXISTS(SELECT 1 FROM subscriptions s WHERE s.business_id = b.id
      AND s.status IN ('active', 'trialing', 'pending_cancel') AND s.expires_at > NOW()) AS subscribed
    FROM users u LEFT JOIN businesses b ON b.user_id = u.id WHERE u.id = ?`, [userId]);
  const row = rows[0];
  return !!row && !!row.is_active && (!!row.subscribed
    || (!row.is_trial_expired && row.trial_end_date && new Date(row.trial_end_date) > new Date()));
}

async function artistAccess(req, res, next) {
  try {
    if (req.user.isAdmin) return next();
    if (!req.user.isOnboarded) return res.status(403).json({ error: 'ONBOARDING_REQUIRED', redirect: '/onboarding' });
    if (!(await hasSubscription(req.user.id))) return res.status(403).json({ error: 'SUBSCRIPTION_REQUIRED', redirect: '/admin/billings' });
    next();
  } catch (error) { next(error); }
}

module.exports = { artistAccess, hasSubscription };
