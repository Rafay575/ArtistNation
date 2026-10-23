# Standard Connect deployment

Artist store purchases use Standard connected accounts and direct charges through Stripe-hosted Checkout. No application fee is collected. Platform subscription billing remains separate, using the platform account. Stripe processing fees still apply to the artist's direct charges.

## Before deployment

1. Back up the database, then apply `migrations/20261023-stripe-standard-checkout.sql`. It creates the checkout ledger and converts orders to InnoDB, which is required for transactional, duplicate-safe fulfillment. Do not deploy the new checkout without this migration.
2. Set `STRIPE_SECRET_KEY` to the new sandbox key. Signup's publishable key and subscription price IDs must also belong to that sandbox. Do not commit secrets.
3. Set `FRONTEND_URL=https://test.artistnation.studio` and verify `ARTIST_SITE_URL_TEMPLATE=https://{subdomain}.artistnation.studio`. The latter controls checkout return URLs; use an explicit localhost template for local work.
4. In the same sandbox configure Connect for full Stripe Dashboard access (Standard), Stripe-hosted onboarding and direct charges. Let Stripe handle connected account pricing. Configure onboarding branding. The code no longer forces US individual status; Stripe collects the account holder's eligible country and business information.
5. Create a **separate snapshot webhook destination** with **Events from: Connected accounts**:
   `https://test.artistnation.studio/api/webhooks/stripe-connect`
   Subscribe to `account.updated`, `account.application.deauthorized`, `checkout.session.completed`, and `checkout.session.async_payment_succeeded`.
   Set its signing secret in `STRIPE_CONNECT_WEBHOOK_SECRET`.
   Keep the existing subscription webhook `/api/webhooks/stripe` and `STRIPE_WEBHOOK_SECRET` unchanged. Nginx must send both URLs directly to Express, preserving the raw request body.
6. Restart backend; rebuild and restart frontend and artist-site. Changes here are local only.

## Existing connections

Express accounts cannot be converted in place. Accounts from another sandbox cannot be used with the new key. The application preserves these references and reports migration required, rather than replacing artists' accounts. Use a fresh test artist first. Before resetting any old test connection, verify it is disposable and keep the old account ID for historical orders/refunds. Live migrations require a planned artist re-onboarding process.

Standard onboarding currently **creates a new account through Account Links**. Connecting an artist's already-existing Stripe account via OAuth is a separate future flow. No OAuth client ID is needed for the implemented onboarding.

## Manual sandbox checks

- New artist: open Stripe Integration, complete hosted onboarding, verify full Dashboard access and charge/payout readiness.
- Fan: add products from the refreshed store (old title-only cart IDs must be removed), choose a valid pickup location and continue to Stripe.
- Test a successful card, a declined card, and an authentication-required card. Confirm charges appear on the artist account, not as platform destination charges.
- Confirm browser return and webhook replay yield one order. Close the tab after paying and verify webhook-only fulfillment.
- Modify browser prices: the server must use saved catalog prices. Cross-artist cart IDs, unavailable pickup locations, invalid quantities and another fan's session must be rejected.
- Verify deauthorization/restricted accounts cannot accept checkout. Preserve old paid orders and use their original connected account for refunds.

Only successful paid sessions create store orders; checkout cancellation and expiry do not create unpaid orders. Card-only checkout is currently enabled. Shipment, inventory reservation, refund/dispute synchronization and OAuth connection of existing accounts are not implemented by this change.
