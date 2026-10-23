const stripe = require('../config/stripe');
const pool = require('../config/db');
const { fulfill } = require('../utils/storeCheckout');
exports.handleConnectWebhook = async (req, res) => {
 let event;
 try {
  if (!process.env.STRIPE_CONNECT_WEBHOOK_SECRET) throw new Error('Connect webhook not configured');
  event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_CONNECT_WEBHOOK_SECRET);
 } catch { return res.status(400).json({ error: 'Invalid Connect webhook signature' }); }
 if (!event.account) return res.status(400).json({ error: 'Connected account event required' });
 try {
  if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
   // Ignore unrelated checkouts created by the artist outside ArtistNation.
   const [rows] = await pool.query('SELECT id FROM store_checkouts WHERE id = ? AND stripe_account_id = ?', [event.data.object.client_reference_id || '', event.account]);
   if (rows.length) await fulfill(event.data.object, event.account);
  } else if (event.type === 'account.updated') {
   // Retrieve current state so out-of-order delivery cannot restore stale readiness.
   const account = await stripe.accounts.retrieve(event.account);
   const status = account.type === 'standard' && account.charges_enabled && account.payouts_enabled ? 'active' : 'restricted';
   await pool.query('UPDATE businesses SET stripe_account_status = ? WHERE stripe_account_id = ?', [status, event.account]);
  } else if (event.type === 'account.application.deauthorized') {
   await pool.query("UPDATE businesses SET stripe_account_status = 'restricted' WHERE stripe_account_id = ?", [event.account]);
  }
  return res.json({ received: true });
 } catch (error) { console.error('Connect webhook processing failed:', error.message); return res.sendStatus(500); }
};
