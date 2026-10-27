# Sandbox clock testing

Set `STRIPE_TEST_CLOCK_ENABLED=true` in backend/.env **only with the sandbox `sk_test_` key**. Keep `BILLING_ARCHIVE_ENABLED=false`. Restart backend and the billing worker with updated environment. No schema migration or frontend rebuild is needed for this change.

The clock is discovered from the Stripe customer referenced by the existing local subscription. No clock ID or arbitrary timestamp is accepted from the browser. Customers without clocks use real time. Live keys, deleted customers and clocks still advancing fail closed. Wait for the simulation to become ready before checking the website. Stripe availability is required for clock-enabled sandbox checks.

For user 45, open the actual customer/subscription in Stripe and confirm the simulation banner is present. Advancing an unrelated simulation won't affect this account. If the customer's simulation is ready at December 8 and its confirmed paid period ends December 7, running `node billing-worker.js --once` should place the site in grace. Refresh the website and dashboard banner afterwards. Opening Billing now uses the same simulated time, so reconciliation no longer restores access just because the server's real date is earlier.

Test cancellation, then advance just beyond the paid-through date: warning page. Advance to expiry plus 29 days: still grace. Advance to expiry plus 30 days: expired/unavailable, but data remains because archival is disabled. Advance in increments allowed by Stripe, waiting for ready and webhook delivery each time. Confirm exact timestamps/timezones rather than dates alone. The worker runs every five real minutes; `--once` performs an immediate reconciliation.

This change doesn't change Stripe's rules for how far a clock can advance or attach a clock to an unrelated existing customer. Do not delete/finish a simulation until testing ends: that deletes its Stripe objects and blocks reconciliation. To disable clock evaluation again, set `STRIPE_TEST_CLOCK_ENABLED=false` and restart backend/worker; sandbox accounts then return to real-time evaluation. No VPS system-clock or SQL expiry edits are required.
