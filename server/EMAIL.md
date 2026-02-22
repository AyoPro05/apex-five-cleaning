# Email configuration (senior-level summary)

## One sender config, all recipient domains

- **Your app** sends email **from** a single identity (SMTP or SendGrid).
- **Recipients** can use **any** email provider (Gmail, Yahoo, Outlook, corporate, etc.).
- **No per-customer-domain configuration.** The same `EMAIL_PROVIDER` and SMTP/SendGrid settings are used for every outbound email. Deliverability depends on **your** sending domain (SPF, DKIM, DMARC), not the recipient’s domain.

## How we handle the “same issues” (verification not arriving)

1. **Config validation at startup**  
   Missing SMTP/SendGrid vars are logged once so you see them in Render/host logs.

2. **Single source of truth**  
   `isEmailConfigured()` and `getEmailConfigStatus()` in `src/utils/emailService.js` so controllers and health checks don’t duplicate logic.

3. **Never claim “email sent” when it wasn’t**  
   Registration (and any other flows that send mail) check the send result and set `verificationStatus.emailSent` and message text accordingly. If email isn’t configured, we skip the send and tell the user to use “Resend verification email”.

4. **Health endpoint for ops**  
   `GET /health` returns `email: { configured, provider, hint? }` (no secrets). Use it to confirm email is configured after deploy or to debug “verification not received”.

5. **Structured send result**  
   All email helpers return `{ success, error? }` so callers can log and respond consistently.

## Required env (backend)

- **SMTP:** `EMAIL_PROVIDER=smtp`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`.
- **SendGrid:** `EMAIL_PROVIDER=sendgrid`, `SENDGRID_API_KEY`, and optionally `SENDGRID_FROM_EMAIL`.
- **All:** `CLIENT_URL` (used for verification links; no trailing slash).

## Quick check after deploy

```bash
curl -s https://your-api.onrender.com/health | jq .email
```

If `configured` is `false`, fix the env vars shown in `hint` and redeploy.
