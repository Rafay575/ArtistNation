const pool = require('../config/db');

async function createSubscription(
  connection, // <-- added
  {
    businessId,
    plan,
    billingCycle,
    stripeSubscriptionId,
    stripeCustomerId,
  }
) {
  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const [result] = await connection.execute(
    `INSERT INTO subscriptions (business_id, plan, billing_cycle, status, stripe_customer_id, stripe_subscription_id, started_at, expires_at)
     VALUES (?, ?, ?, 'active', ?, ?, NOW(), ?)`,
    [businessId, plan, billingCycle, stripeCustomerId, stripeSubscriptionId, trialEnd]
  );
  return result.insertId;
}

async function findSubscriptionByStripeId(stripeSubscriptionId) {
  const [rows] = await pool.query(
    'SELECT * FROM subscriptions WHERE stripe_subscription_id = ?',
    [stripeSubscriptionId]
  );
  return rows[0];
}

async function updateSubscriptionStatus(stripeSubscriptionId, status) {
  const [result] = await pool.query(
    'UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?',
    [status, stripeSubscriptionId]
  );
  return result.affectedRows > 0;
}

async function updateSubscriptionExpiry(stripeSubscriptionId, expiresAt) {
  await pool.query(
    'UPDATE subscriptions SET expires_at = ? WHERE stripe_subscription_id = ?',
    [expiresAt, stripeSubscriptionId]
  );
}

async function getActiveSubscriptionByBusiness(businessId) {
  const [rows] = await pool.query(
    "SELECT * FROM subscriptions WHERE business_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1",
    [businessId]
  );
  return rows[0];
}

module.exports = {
  createSubscription,
  findSubscriptionByStripeId,
  updateSubscriptionStatus,
  updateSubscriptionExpiry,
  getActiveSubscriptionByBusiness,
};