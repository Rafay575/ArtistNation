const Stripe = require('stripe');
// Billing, Connect, and webhook handlers must use the same platform account.
const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is required');
}
const stripe = new Stripe(secretKey, { timeout: 30000, maxNetworkRetries: 2 });
module.exports = stripe;
