# Email configuration

One sender (SMTP or SendGrid) sends to any recipient domain. No per-customer config.

- **SMTP:** `EMAIL_PROVIDER=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_FROM_EMAIL` / `SMTP_FROM_NAME`.
- **SendGrid:** `EMAIL_PROVIDER=sendgrid`, `SENDGRID_API_KEY`, optional `SENDGRID_FROM_EMAIL`.
- **All:** `CLIENT_URL` (no trailing slash) for verification links.

App validates email config at startup; if missing, logs a hint. Never claims “email sent” when it wasn’t.  
`GET /health` returns `email: { configured, provider, hint? }` (no secrets) for ops checks.
