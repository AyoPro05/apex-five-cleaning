# Secret Rotation Checklist

This checklist is based on repository and git-history pattern scanning for sensitive markers.

## Rotate Immediately (if ever set to real values)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SENDGRID_API_KEY`
- `JWT_SECRET`
- `ADMIN_TOKEN`
- `SMTP_PASS`
- `MONGODB_URI` credentials (database user/password)
- `RECAPTCHA_SECRET_KEY`
- `UPLOAD_SIGNING_SECRET`
- `EVENT_WEBHOOK_SECRET`
- `CHATOPS_SECRET`
- `SLACK_SIGNING_SECRET`
- `DISCORD_PUBLIC_KEY`
- `SENTRY_DSN` (server + client)

## Review and Rotate If Used

- `VITE_STRIPE_PUBLIC_KEY` (publishable; low risk, rotate for hygiene if tied to old projects)
- `VITE_SENTRY_DSN` (public ingest endpoint; rotate if abuse/noise observed)
- `LEADS_WEBHOOK_URL`
- `EVENT_WEBHOOK_URLS`

## Verified by scan

- `.env` files are git-ignored.
- No committed `client/.env`, `server/.env`, or root `.env` paths were found in current history.
- Historical commits contain **secret-like markers/placeholders** (for example `sk_test_`, `SG.`, `mongodb+srv://`),
  so treat all related credentials as potentially exposed unless you can prove they were never real values.

## Operational follow-up

1. Rotate values in provider dashboards (Stripe, SendGrid, MongoDB, Google, Sentry, Slack/Discord, etc.).
2. Update deployment environment variables.
3. Revoke old credentials.
4. Redeploy all services.
5. Validate app health and webhook flows.

