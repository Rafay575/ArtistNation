const stripe = require('../config/stripe');
const { syncBusiness } = require('./billingLifecycle');

async function archiveAccount(connection, business) {
 if (business.is_admin) return false;
 let state = await syncBusiness(connection, business);
 if (state.state !== 'expired') return false;
 // Close unpaid recovery sessions before releasing identifiers.
 const [attempts] = await connection.query('SELECT session_id FROM billing_checkout_attempts WHERE business_id=?', [business.id]);
 if (attempts[0]?.session_id) {
  const session = await stripe.checkout.sessions.retrieve(attempts[0].session_id);
  if (session.status === 'open') await stripe.checkout.sessions.expire(session.id);
 }
 // Stop future automatic collection; a late successful payment always wins over archival.
 for (const local of state.subscriptions) {
  if (!['canceled','incomplete_expired'].includes(local.stripe_status)) await stripe.subscriptions.cancel(local.stripe_subscription_id, { invoice_now: false, prorate: false });
  const invoices = await stripe.invoices.list({ subscription: local.stripe_subscription_id, status: 'open', limit: 100 }).autoPagingToArray({ limit: 10000 });
  for (const invoice of invoices) await stripe.invoices.voidInvoice(invoice.id);
 }
 state = await syncBusiness(connection, business);
 if (state.state !== 'expired') return false;
 const [users] = await connection.query('SELECT id,full_name,email,phone,plan,billing_cycle,billing_address,created_at,stripe_customer_id FROM users WHERE id=? AND is_admin=0 FOR UPDATE', [business.user_id]);
 if (!users[0]) return false;
 const [subscriptions] = await connection.query('SELECT * FROM subscriptions WHERE business_id=?', [business.id]);
 const [invoices] = await connection.query('SELECT ih.* FROM invoice_history ih JOIN subscriptions s ON s.id=ih.subscription_id WHERE s.business_id=?', [business.id]);
 await connection.query(`INSERT INTO expired_account_records (original_user_id,original_business_id,email,subdomain,account_record,billing_record,expired_at) VALUES (?,?,?,?,?,?,?)`,
  [business.user_id,business.id,users[0].email,business.subdomain,JSON.stringify({...users[0],business_name:business.business_name,stripe_account_id:business.stripe_account_id}),JSON.stringify({subscriptions,invoices}),state.paidThrough]);
 // Queue upload removal after commit, so a filesystem failure cannot lose the billing record.
 await connection.query('INSERT IGNORE INTO billing_file_cleanup (user_id) VALUES (?)',[business.user_id]);
 await connection.query('DELETE ws FROM website_sections ws JOIN website_pages p ON p.id=ws.page_id WHERE p.user_id=?',[business.user_id]);
 for (const table of ['website_pages','website_media','website_settings','payment_methods','pickup_locations','auth_sessions']) {
  await connection.query(`DELETE FROM ${table} WHERE user_id=?`,[business.user_id]);
 }
 for (const table of ['orders','fans','subscribers','contact_submissions']) {
  await connection.query(`DELETE FROM ${table} WHERE artist_id=?`,[business.user_id]);
 }
 await connection.query('DELETE FROM store_checkouts WHERE business_id=?',[business.id]);
 await connection.query('DELETE FROM billing_checkout_attempts WHERE business_id=?',[business.id]);
 await connection.query('DELETE ih FROM invoice_history ih JOIN subscriptions s ON s.id=ih.subscription_id WHERE s.business_id=?',[business.id]);
 await connection.query('DELETE FROM subscriptions WHERE business_id=?',[business.id]);
 await connection.query('DELETE FROM businesses WHERE id=?',[business.id]);
 await connection.query('DELETE FROM users WHERE id=? AND is_admin=0',[business.user_id]);
 return true;
}
module.exports = { archiveAccount };
