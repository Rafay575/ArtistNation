const pool = require('../config/db');

async function hasSubscription(userId) {
  const [rows] = await pool.query('SELECT id FROM businesses WHERE user_id=?', [userId]);
  if (!rows[0]) return false;
  return (await require('../utils/billingLifecycle').accessState(rows[0].id)).state === 'active';
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
