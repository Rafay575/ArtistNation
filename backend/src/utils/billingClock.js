const stripe = require('../config/stripe');
const { idOf } = require('./billingDates');

async function billingNow(customerId) {
  if (process.env.STRIPE_TEST_CLOCK_ENABLED !== 'true') return Date.now();
  // Never simulate time with a live or restricted key of unknown mode.
  if (!process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) throw new Error('Test clocks require a sandbox secret key');
  if (!customerId) throw new Error('Missing billing customer for test clock lookup');
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || customer.livemode !== false) throw new Error('Sandbox customer could not be verified');
  if (!customer.test_clock) return Date.now();
  const clock = await stripe.testHelpers.testClocks.retrieve(idOf(customer.test_clock));
  if (clock.status !== 'ready' || !Number.isSafeInteger(clock.frozen_time)) throw new Error('Stripe simulation is advancing or unavailable. Wait until it is ready.');
  return clock.frozen_time * 1000;
}
module.exports = { billingNow };
