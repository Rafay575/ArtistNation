const pool = require('../config/db');
const stripe = require('../config/stripe');
const { idOf, paidInvoiceEnd, lifecycle } = require('./billingDates');

async function withBusinessLock(businessId, work) {
 const connection = await pool.getConnection();
 const name = `artistnation-billing-${businessId}`;
 let locked = false;
 try {
  const [result] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [name]);
  if (Number(result[0].acquired) !== 1) throw new Error('Billing update in progress. Please retry.');
  locked = true;
  await connection.beginTransaction();
  const [rows] = await connection.query('SELECT b.*, u.is_admin, u.is_verified FROM businesses b JOIN users u ON u.id=b.user_id WHERE b.id=? FOR UPDATE', [businessId]);
  if (!rows[0]) { await connection.rollback(); return null; }
  const value = await work(connection, rows[0]);
  await connection.commit();
  return value;
 } catch (error) { await connection.rollback(); throw error; }
 finally {
  try { if (locked) await connection.query('SELECT RELEASE_LOCK(?)', [name]); }
  finally { connection.release(); }
 }
}

async function recordInvoice(connection, local, invoice) {
 const [existing] = await connection.query('SELECT id FROM invoice_history WHERE stripe_invoice_id=? AND subscription_id=? LIMIT 1', [invoice.id, local.id]);
 const values = [Number(invoice.amount_paid || invoice.amount_due || 0) / 100, invoice.currency,
  invoice.status === 'paid' ? 'paid' : invoice.status === 'uncollectible' ? 'failed' : 'unpaid',
  invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
  invoice.invoice_pdf || null, invoice.hosted_invoice_url || null];
 if (existing.length) await connection.query('UPDATE invoice_history SET amount=?, currency=?, status=?, paid_at=?, invoice_pdf_url=?, hosted_invoice_url=? WHERE id=?', [...values, existing[0].id]);
 else await connection.query(`INSERT INTO invoice_history (subscription_id,stripe_invoice_id,stripe_subscription_id,amount,currency,status,paid_at,invoice_pdf_url,hosted_invoice_url) VALUES (?,?,?,?,?,?,?,?,?)`, [local.id, invoice.id, local.stripe_subscription_id, ...values]);
}

async function attachCheckout(connection, business, session) {
 if (session.mode !== 'subscription' || session.status !== 'complete' || session.payment_status !== 'paid') return;
 const [attempts] = await connection.query('SELECT * FROM billing_checkout_attempts WHERE business_id=?', [business.id]);
 const attempt = attempts[0];
 if (!attempt || (attempt.session_id ? attempt.session_id !== session.id : session.metadata?.artistnation_request_id !== attempt.request_id)) return;
 const [users] = await connection.query('SELECT stripe_customer_id,plan,billing_cycle FROM users WHERE id=?', [business.user_id]);
 const user = users[0];
 if (idOf(session.customer) !== user.stripe_customer_id || session.metadata?.artistnation_business_id !== String(business.id)) throw new Error('Checkout ownership mismatch');
 if (!attempt.session_id) await connection.query('UPDATE billing_checkout_attempts SET session_id=? WHERE business_id=?', [session.id, business.id]);
 const subscription = await stripe.subscriptions.retrieve(idOf(session.subscription));
 if (idOf(subscription.customer) !== user.stripe_customer_id) throw new Error('Subscription ownership mismatch');
 const [exists] = await connection.query('SELECT id FROM subscriptions WHERE stripe_subscription_id=?', [subscription.id]);
 if (!exists.length) await connection.query(`INSERT INTO subscriptions (business_id,plan,billing_cycle,status,stripe_customer_id,stripe_subscription_id,started_at) VALUES (?,?,?,'pending',?,?,NOW())`,
  [business.id, user.plan, user.billing_cycle, user.stripe_customer_id, subscription.id]);
}

// Retrieve current Stripe objects instead of trusting webhook order or browser input.
async function syncBusiness(connection, business) {
 const [attempts] = await connection.query('SELECT session_id FROM billing_checkout_attempts WHERE business_id=?', [business.id]);
 if (attempts[0]?.session_id) await attachCheckout(connection, business, await stripe.checkout.sessions.retrieve(attempts[0].session_id));
 const [locals] = await connection.query('SELECT * FROM subscriptions WHERE business_id=? ORDER BY id DESC', [business.id]);
 if (!locals.length) throw new Error('Subscription configuration missing; automatic removal is blocked');
 const synced = [];
 for (const local of locals) {
  const subscription = await stripe.subscriptions.retrieve(local.stripe_subscription_id);
  if (idOf(subscription.customer) !== local.stripe_customer_id) throw new Error('Subscription customer mismatch');
  let end = Number(subscription.trial_end || 0);
  // Preserve confirmed historical entitlement, never an unverified legacy expiry.
  if (local.last_synced_at && local.expires_at) end = Math.max(end, new Date(local.expires_at).getTime() / 1000);
  const invoices = await stripe.invoices.list({ subscription: subscription.id, limit: 100 });
  for (let invoice of invoices.data) {
   if (invoice.lines?.has_more) {
    const lines = await stripe.invoices.listLineItems(invoice.id, { limit: 100 }).autoPagingToArray({ limit: 10000 });
    invoice = { ...invoice, lines: { data: lines } };
   }
   end = Math.max(end, paidInvoiceEnd(invoice, subscription.id));
   await recordInvoice(connection, local, invoice);
  }
  // An active subscription without a confirmed paid line must not grant access.
  if (!end) throw new Error('No verified entitlement date; automatic removal is blocked');
  const expiresAt = new Date(end * 1000);
  const future = expiresAt > new Date();
  const status = future ? subscription.cancel_at_period_end || subscription.status === 'canceled' ? 'pending_cancel'
   : subscription.status === 'trialing' ? 'trialing' : 'active' : 'inactive';
  await connection.query('UPDATE subscriptions SET status=?, expires_at=?, stripe_status=?, cancel_at_period_end=?, last_synced_at=NOW() WHERE id=?',
   [status, expiresAt, subscription.status, !!subscription.cancel_at_period_end, local.id]);
  synced.push({ ...local, status, expires_at: expiresAt, stripe_status: subscription.status, cancel_at_period_end: !!subscription.cancel_at_period_end, remote: subscription });
 }
 const end = new Date(Math.max(...synced.map(sub => sub.expires_at.getTime())));
 const state = lifecycle(end);
 await connection.query('UPDATE businesses SET is_active=?, grace_period_end=? WHERE id=?', [state.state === 'active' && business.is_verified ? 1 : 0, state.state === 'active' ? null : state.graceEnd, business.id]);
 await connection.query('UPDATE users SET is_trial_expired = (trial_end_date <= NOW()) WHERE id=?', [business.user_id]);
 return { ...state, subscriptions: synced };
}

async function accessState(businessId) {
 const [rows] = await pool.query(`SELECT b.is_active, MAX(s.expires_at) AS expires_at FROM businesses b LEFT JOIN subscriptions s ON s.business_id=b.id WHERE b.id=? GROUP BY b.id,b.is_active`, [businessId]);
 if (!rows.length) return { state: 'unavailable' };
 const state = lifecycle(rows[0].expires_at);
 // Never bypass a manual business suspension.
 if (state.state === 'active' && !rows[0].is_active) return { ...state, state: 'unavailable' };
 return state;
}
module.exports = { withBusinessLock, syncBusiness, recordInvoice, accessState, attachCheckout };
