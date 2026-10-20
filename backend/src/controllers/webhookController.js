const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const {
  findSubscriptionByStripeId,
  updateSubscriptionStatus,
  updateSubscriptionExpiry,
} = require('../models/subscription');
const pool = require('../config/db');

/**
 * Handle Stripe webhook events
 * This is a raw body handler — do NOT use express.json() for this route
 */
async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  // 1. Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📩 Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      /**
       * ============================================
       * EVENT: invoice.paid
       * ============================================
       * Triggered when an invoice is successfully paid.
       * Handles both subscription invoices AND one-time payments.
       */
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        const amountPaid = invoice.amount_paid || 0;

        // ============================================================
        // ✅ FIX 1: Skip zero-dollar invoices
        // ============================================================
        if (amountPaid <= 0) {
          console.log(`ℹ️ Skipping zero-dollar invoice ${invoice.id} (amount: $0)`);
          break;
        }

        // ============================================================
        // ✅ FIX 2: Handle one-time payments (no subscription)
        // ============================================================
        if (!subId) {
          console.log(`💰 One-time payment of $${(amountPaid / 100).toFixed(2)} recorded`);

          // Find if there's a user associated with this customer
          const customerId = invoice.customer;
          let userId = null;
          let businessId = null;

          if (customerId) {
            const [userRows] = await pool.query(
              `SELECT u.id as user_id, b.id as business_id
               FROM users u
               JOIN businesses b ON b.user_id = u.id
               WHERE u.stripe_customer_id = ?
               LIMIT 1`,
              [customerId]
            );

            if (userRows.length > 0) {
              userId = userRows[0].user_id;
              businessId = userRows[0].business_id;
            }
          }

          // Record the one-time payment in invoice_history
          await pool.query(
            `INSERT INTO invoice_history 
             (subscription_id, stripe_invoice_id, stripe_subscription_id, 
              amount, currency, status, paid_at, invoice_pdf_url, hosted_invoice_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              null, // No subscription
              invoice.id,
              null, // No subscription ID
              amountPaid / 100,
              invoice.currency,
              'paid',
              new Date(invoice.created * 1000),
              invoice.invoice_pdf || null,
              invoice.hosted_invoice_url || null,
            ]
          );

          // Also update business if found (mark as active)
          if (businessId) {
            await pool.query('UPDATE businesses SET is_active = TRUE WHERE id = ?', [businessId]);
            console.log(`✅ Business ${businessId} activated after one-time payment`);
          }

          break;
        }

        // ============================================================
        // Handle subscription invoices (existing logic)
        // ============================================================
        const sub = await findSubscriptionByStripeId(subId);
        if (!sub) {
          console.log(`⚠️ Subscription ${subId} not found in DB, skipping`);
          break;
        }

        // Calculate new expiry date
        const periodEnd = new Date(invoice.period_end * 1000);

        // Update subscription
        await updateSubscriptionExpiry(subId, periodEnd);
        await updateSubscriptionStatus(subId, 'active');

        // Activate business
        await pool.query('UPDATE businesses SET is_active = TRUE WHERE id = ?', [sub.business_id]);

        // Log invoice in history table
        await pool.query(
          `INSERT INTO invoice_history 
           (subscription_id, stripe_invoice_id, stripe_subscription_id, 
            amount, currency, status, paid_at, invoice_pdf_url, hosted_invoice_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sub.id,
            invoice.id,
            invoice.subscription,
            amountPaid / 100,
            invoice.currency,
            'paid',
            new Date(invoice.created * 1000),
            invoice.invoice_pdf || null,
            invoice.hosted_invoice_url || null,
          ]
        );

        console.log(`✅ Subscription ${subId} paid $${(amountPaid / 100).toFixed(2)}, active until ${periodEnd.toISOString()}`);
        break;
      }

      /**
       * ============================================
       * EVENT: invoice.payment_failed
       * ============================================
       */
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        const amountDue = invoice.amount_due || 0;

        // If no subscription, it's a one-time invoice that failed
        if (!subId) {
          console.log(`⚠️ One-time payment failed: $${(amountDue / 100).toFixed(2)}`);
          // Optionally record failed one-time payment
          await pool.query(
            `INSERT INTO invoice_history 
             (subscription_id, stripe_invoice_id, stripe_subscription_id, 
              amount, currency, status, paid_at, invoice_pdf_url, hosted_invoice_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              null,
              invoice.id,
              null,
              amountDue / 100,
              invoice.currency,
              'failed',
              null,
              invoice.invoice_pdf || null,
              invoice.hosted_invoice_url || null,
            ]
          );
          break;
        }

        const sub = await findSubscriptionByStripeId(subId);
        if (!sub) break;

        // Deactivate subscription
        await updateSubscriptionStatus(subId, 'inactive');
        await pool.query('UPDATE businesses SET is_active = FALSE WHERE id = ?', [sub.business_id]);

        // Log failed invoice
        await pool.query(
          `INSERT INTO invoice_history 
           (subscription_id, stripe_invoice_id, stripe_subscription_id, 
            amount, currency, status, paid_at, invoice_pdf_url, hosted_invoice_url) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sub.id,
            invoice.id,
            invoice.subscription,
            amountDue / 100,
            invoice.currency,
            'failed',
            null,
            invoice.invoice_pdf || null,
            invoice.hosted_invoice_url || null,
          ]
        );

        console.log(`❌ Subscription ${subId} payment failed, deactivated`);
        break;
      }

      /**
       * ============================================
       * EVENT: customer.subscription.deleted
       * ============================================
       */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const sub = await findSubscriptionByStripeId(subscription.id);

        if (!sub) {
          console.log(`⚠️ Subscription ${subscription.id} not found in DB, skipping`);
          break;
        }

        await updateSubscriptionStatus(subscription.id, 'inactive');

        await pool.query(
          `UPDATE businesses 
           SET is_active = FALSE, 
               grace_period_end = DATE_ADD(NOW(), INTERVAL 30 DAY) 
           WHERE id = ?`,
          [sub.business_id]
        );

        console.log(`🗑️ Subscription ${subscription.id} deleted, grace period started`);
        break;
      }

      /**
       * ============================================
       * EVENT: customer.subscription.updated
       * ============================================
       */
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const sub = await findSubscriptionByStripeId(subscription.id);

        if (!sub) {
          console.log(`⚠️ Subscription ${subscription.id} not found in DB, skipping`);
          break;
        }

        // Check if subscription is marked for cancellation at period end
        if (subscription.cancel_at_period_end) {
          await updateSubscriptionStatus(subscription.id, 'pending_cancel');
          console.log(`⏳ Subscription ${subscription.id} will cancel at period end`);
        }

        // Check if subscription was reactivated
        if (!subscription.cancel_at_period_end && subscription.status === 'active') {
          await updateSubscriptionStatus(subscription.id, 'active');
          console.log(`🔄 Subscription ${subscription.id} reactivated`);
        }

        // If subscription is active, update expiry
        if (subscription.status === 'active') {
          const periodEnd = new Date(subscription.current_period_end * 1000);
          await updateSubscriptionExpiry(subscription.id, periodEnd);
          await pool.query('UPDATE businesses SET is_active = TRUE WHERE id = ?', [sub.business_id]);
          console.log(`✅ Subscription ${subscription.id} active, expiry updated to ${periodEnd.toISOString()}`);
        }

        break;
      }

      /**
       * ============================================
       * EVENT: customer.subscription.trial_will_end
       * ============================================
       */
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object;
        const sub = await findSubscriptionByStripeId(subscription.id);

        if (!sub) break;

        const [user] = await pool.query(
          `SELECT u.email, u.full_name 
           FROM users u 
           JOIN businesses b ON b.user_id = u.id 
           WHERE b.id = ?`,
          [sub.business_id]
        );

        if (user && user.length > 0) {
          console.log(`📧 Trial ending soon for ${user[0].email}. Send reminder email.`);
          // TODO: Send email notification
        }

        break;
      }

      default:
        console.log(`📩 Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

module.exports = { handleStripeWebhook };