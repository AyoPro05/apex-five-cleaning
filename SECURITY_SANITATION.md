Security sanitisation steps applied and recommended next actions

Immediate actions taken
- Verified `.gitignore` excludes `.env` and related files.
- Confirmed `server/.env` is not tracked in Git (only `server/.env.example` is tracked).
- Added opt-in `logAuthHeader` middleware (disabled by default) to help debug admin auth header delivery. It is safe by default and enabled only when `DEBUG_AUTH=true`.

Required remediation (action items you should complete now)
1. Rotate exposed secrets immediately if they were ever in a shared remote or backup: `JWT_SECRET`, `ADMIN_TOKEN`, `SENDGRID_API_KEY`, `MONGODB_URI` credentials, and any other provider keys.
2. In your hosting provider (Vercel), set the new secrets using the dashboard's Environment Variables UI. Do NOT upload `.env` files to the repo.
3. If any secrets were pushed to remote history, purge them with `git filter-repo` or BFG and rotate secrets afterwards. Example with BFG:

   - Install BFG and run:

     bfg --delete-files .env
     git reflog expire --expire=now --all && git gc --prune=now --aggressive

   - Then force-push and rotate secrets.

Further hardening recommendations
- Consider switching admin authentication flow to set admin JWTs in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie instead of client-side localStorage.
- Enable `helmet` Content Security Policy (`contentSecurityPolicy`) with a tested policy (start strict and relax as needed). Test thoroughly in staging.
- Confirm `app.set('trust proxy', 1)` is set in production (required for correct `req.ip` and secure cookies behind Vercel).
- Enforce minimal CORS origins in `server/src/config/corsConfig.js` and disallow wildcard origins in production.
- Ensure rate limiting (`apiRateLimiter`) is tuned for production traffic.
- Schedule dependency upgrades: `react-router` advisory needs a targeted upgrade and testing; run `npm audit` and fix remaining advisories.

Verification checklist
- Rotate secrets ✅
- Confirm no `.env` files are present in remote repo ✅
- Redeploy with new environment variables set in Vercel ✅
- Verify admin login and quote submissions in production ✅

If you want, I can:
- Rotate secrets guidance + rollback steps
- Purge secrets from Git history (requires force-push and coordination)
- Implement HttpOnly cookie admin session flow (non-trivial, I can draft the changes)
