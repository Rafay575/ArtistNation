Authentication update
=====================

Before deploying, run migrations/20261021-auth-sessions.sql on the deployment database. It creates auth_sessions and auth_rate_limits without changing existing user records. The migration was applied to the configured local database during implementation.

Deploy backend and frontend together. Existing artist/admin tokens are intentionally rejected; users must sign in again. Fan authentication keeps its separate flow.

The frontend now forwards API calls through /api/backend/... and holds the credential in a host-only HttpOnly, SameSite=Lax cookie. Production cookies require HTTPS. Keep that route available in the hosting/reverse-proxy configuration. BACKEND_API_URL may specify the backend address reachable by the Next.js server; it falls back to NEXT_PUBLIC_API_URL, then http://localhost:5000. FRONTEND_URL should be the public frontend origin when deployed behind a reverse proxy.

Each authenticated API request checks the current account, password version, and persisted session. Logout revokes the current session. A password reset invalidates all previous sessions and consumes its reset grant in the same database update. Signing keys must remain server-only.

Global administrator pages: users, cms-admin, contact, admin-subscribers, payments. Their backend endpoints still require a current database administrator role. Shared dashboard/profile pages use the current authenticated account.

Artist CMS, orders, fans, Connect, pickup locations, inquiries, subscribers, and dashboard statistics require completed onboarding and an active trial/subscription. Billing, logout, session lookup, recovery, and account profile APIs remain accessible for recovery. Public site/contact/subscription endpoints remain public.

Login and OTP limits use database buckets across workers. Account buckets apply independently of IP addresses. The IP bucket sees the immediate API caller; requests via the Next.js gateway share that gateway's address. Review gateway/IP limits for expected traffic and configure a trusted ingress before using forwarded client addresses; never blindly trust client-provided X-Forwarded-For headers.

Operational maintenance: periodically delete expired auth_sessions and expired auth_rate_limits rows. Rate-limit middleware also removes old rate buckets periodically. No functional, payment, email, or browser tests were run for this update; verification was limited to syntax and frontend type checks.
