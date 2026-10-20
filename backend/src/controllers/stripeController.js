const stripe = require('../config/stripe');
const { getBusinessByUserId, updateStripeAccount, findBusinessBySubdomain } = require('../models/business');

const orderModel = require('../models/order');
const { findFanById } = require('../models/fan'); // ensure you have this

exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { subdomain } = req.params;
    const { paymentMethodId, total, fanInfo } = req.body;
    const fanId = req.fan.id; // from fanAuth middleware
    const artistId = req.fan.artist_id; // set in middleware

    const business = await findBusinessBySubdomain(subdomain);
    if (!business || !business.stripe_account_id) {
      return res.status(400).json({ error: 'Artist not connected to Stripe' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      payment_method_types: ['card'],
      description: `Order from ${fanInfo.email}`,
      transfer_data: {
        destination: business.stripe_account_id,
      },
      application_fee_amount: 0,
    });

    // Save order after success
    await orderModel.createOrder({
      fan_id: fanId,
      artist_id: artistId,
      business_id: business.id,
      items: fanInfo.items, // pass items array from cart
      total,
      pickup_location: fanInfo.pickupLocation,
      first_name: fanInfo.firstName,
      last_name: fanInfo.lastName,
      email: fanInfo.email,
      phone: fanInfo.phone,
      street_address: fanInfo.street,
      city: fanInfo.city,
      postal_code: fanInfo.postalCode,
      payment_intent_id: paymentIntent.id,
    });

    res.json({ success: true, paymentIntentId: paymentIntent.id });
  } catch (err) {
    next(err);
  }
};

exports.createConnectAccountLink = async (req, res, next) => {
  try {
    const userId = req.user.id;   // from auth middleware
    console.log('userId from token:', userId);

    const business = await getBusinessByUserId(userId);
    console.log('business found:', business ? business.id : 'none');

    if (!business) {
      return res.status(404).json({ error: 'Business not found for this user' });
    }

    let stripeAccountId = business.stripe_account_id;
    if (!stripeAccountId) {
      console.log('Creating new Express account...');
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: req.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
      });
      stripeAccountId = account.id;
      await updateStripeAccount(business.id, stripeAccountId, 'pending');
      console.log('New Stripe account created:', stripeAccountId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.FRONTEND_URL}/admin/payment-integration?refresh=true`,
      return_url: `${process.env.FRONTEND_URL}/admin/payment-integration?success=true`,
      type: 'account_onboarding',
    });

    console.log('Account link generated');
    res.json({ url: accountLink.url });
  } catch (err) {
    console.error('Stripe Connect error:', err);   // 👈 see actual error in terminal
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

exports.getConnectStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const business = await getBusinessByUserId(userId);
    if (!business || !business.stripe_account_id) {
      return res.json({ connected: false, status: null });
    }

    const account = await stripe.accounts.retrieve(business.stripe_account_id);
    const status = account.charges_enabled ? 'active' : 'pending';
    if (status !== business.stripe_account_status) {
      await updateStripeAccount(business.id, business.stripe_account_id, status);
    }

    res.json({
      connected: account.charges_enabled,
      status,
      accountId: business.stripe_account_id,
    });
  } catch (err) {
    console.error('Status check error:', err);
    next(err);
  }
};


// controllers/stripeController.js

exports.getPublicStripeStatus = async (req, res, next) => {
  try {
    const { subdomain } = req.params;
    const business = await findBusinessBySubdomain(subdomain);
    if (!business) return res.status(404).json({ error: 'Artist not found' });

    const connected = !!(business.stripe_account_id && business.stripe_account_status === 'active');
    res.json({ connected });
  } catch (err) {
    next(err);
  }
};