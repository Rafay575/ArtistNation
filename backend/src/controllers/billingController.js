const pool = require('../config/db');
const stripe = require('../config/stripe');

/**
 * GET /api/billing/overview
 * Get subscription, business, and user details
 */
async function getBillingOverview(req, res) {
  try {
    const userId = req.user.id; // From auth middleware

    // Get user with subscription and business
    const [rows] = await pool.query(
      `SELECT 
         u.id as user_id,
         u.full_name,
         u.email,
         u.plan,
         u.billing_cycle,
         u.stripe_customer_id,
         b.id as business_id,
         b.business_name,
         b.subdomain,
         b.is_active,
         b.grace_period_end,
         s.id as subscription_id,
         s.status as subscription_status,
         s.stripe_subscription_id,
         s.started_at,
         s.expires_at
       FROM users u
       LEFT JOIN businesses b ON b.user_id = u.id
       LEFT JOIN subscriptions s ON s.business_id = b.id
       WHERE u.id = ? AND s.status IN ('active', 'trialing', 'pending_cancel', 'inactive')
       ORDER BY s.id DESC
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        error: 'No subscription found. Please subscribe to a plan.' 
      });
    }

    const data = rows[0];

    // Get cancel_at_period_end from Stripe
    let cancelAtPeriodEnd = false;
    let stripeStatus = null;

    if (data.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(data.stripe_subscription_id);
        cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
        stripeStatus = subscription.status;
      } catch (err) {
        console.error('Error fetching Stripe subscription:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          id: data.user_id,
          full_name: data.full_name,
          email: data.email,
          plan: data.plan || 'No plan',
          billing_cycle: data.billing_cycle || 'N/A',
        },
        business: {
          id: data.business_id,
          name: data.business_name,
          subdomain: data.subdomain,
          is_active: data.is_active === 1,
          grace_period_end: data.grace_period_end,
        },
        subscription: {
          id: data.subscription_id,
          stripe_id: data.stripe_subscription_id,
          status: data.subscription_status,
          stripe_status: stripeStatus,
          cancel_at_period_end: cancelAtPeriodEnd,
          started_at: data.started_at,
          expires_at: data.expires_at,
          is_trialing: data.subscription_status === 'trialing',
          is_active: data.subscription_status === 'active',
          is_pending_cancel: data.subscription_status === 'pending_cancel',
          is_inactive: data.subscription_status === 'inactive',
        }
      }
    });

  } catch (error) {
    console.error('Billing overview error:', error);
    res.status(500).json({ error: 'Failed to fetch billing overview' });
  }
}

/**
 * GET /api/billing/invoices
 * Get invoice history for the user
 */
async function getInvoiceHistory(req, res) {
  try {
    const userId = req.user.id;

    // First get the user's subscription
    const [subRows] = await pool.query(
      `SELECT s.id as subscription_id 
       FROM users u
       JOIN businesses b ON b.user_id = u.id
       JOIN subscriptions s ON s.business_id = b.id
       WHERE u.id = ? AND s.status IN ('active', 'trialing', 'pending_cancel', 'inactive')
       ORDER BY s.id DESC
       LIMIT 1`,
      [userId]
    );

    if (subRows.length === 0) {
      return res.json({ success: true, invoices: [] });
    }

    const subscriptionId = subRows[0].subscription_id;

    // Get invoice history
    const [invoices] = await pool.query(
      `SELECT 
         id,
         stripe_invoice_id,
         amount,
         currency,
         status,
         paid_at,
         invoice_pdf_url,
         hosted_invoice_url,
         created_at
       FROM invoice_history
       WHERE subscription_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [subscriptionId]
    );

    res.json({
      success: true,
      invoices: invoices.map(inv => ({
        id: inv.id,
        stripe_invoice_id: inv.stripe_invoice_id,
        amount: parseFloat(inv.amount),
        currency: inv.currency,
        status: inv.status,
        paid_at: inv.paid_at,
        invoice_pdf_url: inv.invoice_pdf_url,
        hosted_invoice_url: inv.hosted_invoice_url,
        created_at: inv.created_at,
      }))
    });

  } catch (error) {
    console.error('Invoice history error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice history' });
  }
}

/**
 * POST /api/billing/cancel
 * Cancel subscription at period end
 */
async function cancelSubscription(req, res) {
  try {
    const userId = req.user.id;

    // Get subscription
    const [rows] = await pool.query(
      `SELECT s.id as subscription_id, 
              s.stripe_subscription_id,
              s.status,
              s.expires_at,
              b.id as business_id
       FROM users u
       JOIN businesses b ON b.user_id = u.id
       JOIN subscriptions s ON s.business_id = b.id
       WHERE u.id = ? AND s.status IN ('active', 'trialing')
       ORDER BY s.id DESC
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const sub = rows[0];

    // Cancel in Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      sub.stripe_subscription_id,
      {
        cancel_at_period_end: true,
        cancellation_details: {
          comment: 'User requested cancellation via billing page',
        }
      }
    );

    // Update database status to 'pending_cancel'
    await pool.query(
      'UPDATE subscriptions SET status = ? WHERE id = ?',
      ['pending_cancel', sub.subscription_id]
    );

    // ============================================================
    // ✅ FIX: SAFELY GET EXPIRATION DATE WITH FALLBACKS
    // ============================================================

    let expiresAt;

    // Try 1: Get from Stripe response
    if (updatedSubscription.current_period_end) {
      expiresAt = new Date(updatedSubscription.current_period_end * 1000);
    }
    // Try 2: Use existing database value
    else if (sub.expires_at) {
      expiresAt = new Date(sub.expires_at);
    }
    // Try 3: Fallback to 30 days from now
    else {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // Validate the date - if still invalid, use 30 days from now
    if (isNaN(expiresAt.getTime())) {
      console.warn('Invalid expiration date, using fallback 30 days');
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    console.log(`✅ Subscription ${sub.stripe_subscription_id} will cancel at ${expiresAt.toISOString()}`);

    res.json({
      success: true,
      message: 'Your subscription will be canceled at the end of the current billing period.',
      expires_at: expiresAt.toISOString(),
      cancel_at_period_end: true,
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
}

/**
 * POST /api/billing/reactivate
 * Reactivate a subscription that was set to cancel at period end
 */
async function reactivateSubscription(req, res) {
  try {
    const userId = req.user.id;

    // Get subscription
    const [rows] = await pool.query(
      `SELECT s.id as subscription_id, 
              s.stripe_subscription_id,
              s.status
       FROM users u
       JOIN businesses b ON b.user_id = u.id
       JOIN subscriptions s ON s.business_id = b.id
       WHERE u.id = ? AND s.status = 'pending_cancel'
       ORDER BY s.id DESC
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No subscription pending cancellation' });
    }

    const sub = rows[0];

    // Reactivate in Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      sub.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    );

    // Update database status back to 'active'
    await pool.query(
      'UPDATE subscriptions SET status = ? WHERE id = ?',
      ['active', sub.subscription_id]
    );

    res.json({
      success: true,
      message: 'Your subscription has been reactivated. It will continue to renew normally.',
      cancel_at_period_end: false,
    });

  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ error: error.message || 'Failed to reactivate subscription' });
  }
}

module.exports = {
  getBillingOverview,
  getInvoiceHistory,
  cancelSubscription,
  reactivateSubscription,
};
