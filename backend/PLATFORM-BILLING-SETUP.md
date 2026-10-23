# Platform subscriptions and expiry lifecycle

ArtistNation subscription billing uses the platform's `STRIPE_SECRET_KEY`. Artist store Connect payments use the same platform key with connected-account scoping, but a different webhook. Do not replace the Connect webhook secret.

## Behaviour

- Signup keeps the existing $1 setup charge and 14-day trial. Card authentication is completed in Stripe.js when required. The subscription's actual Stripe trial end is stored locally. Configuration problems no longer claim the card is invalid.
- Recurring collection is scheduled by Stripe. `billing-worker.js` reconciles current Stripe subscriptions/invoices every five minutes; it does not make recurring charges itself.
- Confirmed paid subscription invoice lines (including legitimate zero-dollar paid invoices) and the actual trial end determine access. An unpaid next period never grants an extension. A failed invoice never shortens an already paid period.
- Cancellation stops renewal at period end. Access continues through the confirmed expiry. Reactivation before Stripe ends the subscription restores auto-renewal. After it ends, Renew subscription creates a new paid subscription without another trial or setup fee.
- At expiry the public website becomes a warning page, including on deep links. Website APIs and checkout are blocked. The owner retains authenticated billing/profile access to pay an outstanding invoice or renew.
- Grace ends exactly 30 days after the paid/trial end, independent of webhook delivery time. Successful payment restores access immediately upon reconciliation.
- With archival enabled, the worker verifies Stripe again, closes open renewal Checkout sessions, cancels outstanding subscription collection without proration, voids unpaid open subscription invoices, and checks again for late payment. It then archives an allowlisted account record plus subscription/invoice history in `expired_account_records` and removes the account's active data in one InnoDB transaction. A late payment or verification/API failure prevents removal.
- Only account identity/contact/billing information and Stripe references remain in that record. Passwords, tokens, payment-method/card information, site content, fans, store orders and uploads are not archived. Upload removal is queued after database commit and retried. Shared default artwork is preserved. Email/subdomain are released by removing their active account/business rows. Stripe-side financial records and the artist's Standard Stripe account are not deleted.

## Deploy in order

1. Install the previous auth-session, onboarding and Standard checkout migrations if not already installed. Run `migrations/20261024-platform-billing-lifecycle.sql` once. It converts affected tables to InnoDB and adds lifecycle/archive tables and subscription sync fields. This DDL can lock large tables: schedule the migration appropriately.
2. In this **same Stripe sandbox** create the intended recurring prices and set backend variables:

   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_MONTHLY_PRICE_ID=price_...
   STRIPE_YEARLY_PRICE_ID=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   FRONTEND_URL=https://test.artistnation.studio
   BILLING_ARCHIVE_ENABLED=false
   ```

   Plan-specific `STRIPE_STARTER_MONTHLY_PRICE_ID` / `STRIPE_STARTER_YEARLY_PRICE_ID` take precedence. Other plans use `STRIPE_<PLAN>_<CYCLE>_PRICE_ID`. Monthly/yearly prices must be active recurring prices with interval_count=1. The admin frontend publishable key must match the sandbox; changing it requires a rebuild. Old customers, subscriptions and price IDs cannot be transferred to the new sandbox simply by changing keys. Use fresh sandbox users, or arrange explicit billing re-enrollment for old users. Missing Stripe objects block reconciliation and archival.
3. In Workbench create/configure the platform **snapshot** destination with **Events from: Your account** at:
   `https://test.artistnation.studio/api/webhooks/stripe`
   Include `invoice.paid`, `invoice.payment_failed`, `invoice.finalized`, `invoice.voided`, `invoice.marked_uncollectible`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`. Put this endpoint's secret in `STRIPE_WEBHOOK_SECRET`. Keep `/api/webhooks/stripe-connect` and `STRIPE_CONNECT_WEBHOOK_SECRET` separate.
4. Configure the platform Customer Portal in the same sandbox: enable payment-method updates, invoice history/payments and cancellation **at period end**. Disable subscription plan changes for now (the app's stored plan/cycle remain the source for renewal). Optionally set `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` to this configuration's `bpc_...` ID. The app creates short-lived authenticated customer-specific portal links; no public shared billing login is used.
5. Set artist-site `BACKEND_API_URL=http://localhost:5000` for internal status requests and `NEXT_PUBLIC_ADMIN_URL=https://test.artistnation.studio`. Confirm HTTPS works on artist subdomains. The artist app now uses `proxy.ts` instead of the old `middleware.ts` and no longer reads the database directly for availability. Rebuild both Next.js apps, restart backend/admin/artist processes with updated environment.
6. From backend run `node billing-worker.js --once` with archival disabled. This synchronizes billing and reports expired candidates without deleting data. Inspect errors for old sandbox IDs or missing entitlement. Verify a paid account, cancellation, grace warning, payment recovery and the 30-day boundary using dedicated sandbox accounts. This first reconciliation corrects historical expiry estimates to Stripe-confirmed dates.
7. Start the reconciliation worker as a fourth PM2 process:

   ```bash
   pm2 start /var/www/ArtistNation-new/backend/billing-worker.js --name artistnation-billing-worker --cwd /var/www/ArtistNation-new/backend
   pm2 save
   ```

8. Once sandbox checks pass, set `BILLING_ARCHIVE_ENABLED=true` in backend/.env and restart the worker. Enabling it applies to accounts already more than 30 days expired, not just future expirations. It removes their site/fan/order/upload data after retaining the account/billing record. API calls alone do not start the archive worker. Keep automatic removal disabled until sandbox end-to-end and database-restore checks are complete.

Check existing VPS cron tasks, MySQL events and old worker processes. Disable any old job that also deactivates/deletes users or charges subscriptions; only one lifecycle should control these operations. Duplicate instances of the new worker serialize each business using MySQL advisory locks, but external jobs do not share those locks.

## Validation

`node --test tests/billing-lifecycle.test.cjs tests/onboarding.test.cjs tests/stripe-standard.test.cjs` runs isolated tests without sending payments/emails or modifying the live database. Test Stripe sandbox webhooks, portal settings, SQL migration/rollback and archival against a disposable database before enabling removal. Archived records must be restricted to privileged database/admin access and retained according to the business's record-retention policy.

Local validation for this change: 45 isolated checks and both TypeScript checks passed. Production builds could not finish because Google Fonts could not be downloaded; the artist app's local installation also lacks the already-declared `tw-animate-css` dependency. Use `npm ci` before building on the VPS. No local MySQL server was available, so the migration and real database rollback/archive behaviour remain to be validated on a disposable sandbox database. No live payment or deletion was performed.
