const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_1);
module.exports = stripe;