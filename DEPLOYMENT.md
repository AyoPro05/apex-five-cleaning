# Deployment Guide - Apex Five Cleaning

## Pre-Deployment Checklist

### Development Environment
- [ ] All npm dependencies installed (`npm install` in both client and server)
- [ ] `.env` file created in server directory with all required variables
- [ ] MongoDB connection string valid and accessible
- [ ] Stripe keys are correct (test keys should be replaced with live keys)
- [ ] reCAPTCHA keys configured
- [ ] Email service (SendGrid or SMTP) configured and tested

### Client Build
- [ ] `npm run build` completes without errors in `client/`
- [ ] `dist/` folder generated successfully
- [ ] `.env.production` created with production values
- [ ] VITE_API_URL points to your backend domain

### Server Configuration
- [ ] NODE_ENV=production in `.env`
- [ ] MONGODB_URI uses production database
- [ ] JWT_SECRET is a strong random string (min 32 chars)
- [ ] STRIPE keys are live keys (sk_live_*, pk_live_*)
- [ ] STRIPE_WEBHOOK_SECRET configured from Stripe dashboard
- [ ] ADMIN_TOKEN is a strong random string
- [ ] CLIENT_URL matches your frontend domain (HTTPS)

---

## Deployment Options

### Option 1: Vercel (Recommended for this stack)

**Setup:**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy client first
cd client
vercel --prod

# 3. Deploy server
cd ../server
vercel --prod
```

**Vercel Configuration (already partially set):**
- `vercel.json` is configured for client builds
- For server: Create separate Vercel project

**Environment Variables in Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env` file
3. Mark sensitive vars accordingly

### Option 2: Railway / Render

**Railway Example:**
```bash
# Connect your git repository
# Set environment variables in dashboard
# Deploy with single command:
railway up
```

### Option 3: Docker + Cloud Platform (AWS, DigitalOcean)

**Dockerfile for Server:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
COPY middleware ./middleware
COPY models ./models
COPY routes ./routes
EXPOSE 5000
CMD ["node", "src/index.js"]
```

---

## Production Environment Setup

### 1. MongoDB Atlas Setup
```
1. Go to https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Create database user with strong password
4. Whitelist IP addresses
5. Get connection string: mongodb+srv://user:pass@cluster.mongodb.net/
6. Add to MONGODB_URI in production .env
```

### 2. Stripe Configuration
```
1. Go to https://stripe.com/dashboard
2. Copy live secret key (sk_live_...)
3. Copy live publishable key (pk_live_...)
4. Setup webhook endpoint:
   - Endpoint: https://yourdomain.com/api/payments/webhook
   - Events: payment_intent.succeeded, payment_intent.payment_failed
5. Copy webhook secret (whsec_...)
```

### 3. SendGrid / Email Setup
```
Option A: SendGrid
1. Create account at https://sendgrid.com
2. Verify sender domain
3. Create API key
4. Add to SENDGRID_API_KEY

Option B: Gmail/SMTP
1. Enable 2-factor auth
2. Generate app-specific password
3. Use in SMTP_PASS
4. Set EMAIL_PROVIDER=smtp
```

### 4. reCAPTCHA Setup
```
1. Go to https://www.google.com/recaptcha/admin
2. Create new site for your domain
3. Use reCAPTCHA v3 (recommended)
4. Copy site key (VITE_RECAPTCHA_SITE_KEY)
5. Copy secret key (RECAPTCHA_SECRET_KEY)
```

---

## Domain & SSL Configuration

### For Vercel:
- Automatic HTTPS with Let's Encrypt
- Add custom domain in project settings
- DNS records updated automatically

### For Other Platforms:
- Add SSL certificate (Let's Encrypt free)
- Configure HTTPS redirect (already in server code)
- Update CORS origins if needed

---

## Post-Deployment Testing

### 1. API Health Check
```bash
curl https://api.yourdomain.com/api/health
# Should return: {"status":"OK","timestamp":"..."}
```

### 2. CORS Testing
```javascript
// In browser console on your frontend domain
fetch('https://api.yourdomain.com/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
```

### 3. Stripe Payment Test
- Use test card: 4242 4242 4242 4242
- Any future exp date, any CVC
- Should create payment intent and process

### 4. Email Verification
- Test email sending during signup
- Verify email tokens work

### 5. Admin Dashboard
- Login with admin token
- Fetch quotes (should have permission checking)

---

## Monitoring & Logging

### Recommended Tools:
- **Error Tracking:** Sentry (free tier)
- **Monitoring:** UptimeRobot (free)
- **Logs:** Cloud provider native (Vercel, Railway logs)

### Add to Server:
```javascript
// Consider adding Sentry for error tracking:
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

## Performance Optimization

### Client:
- ✅ Vite already optimizes build
- Consider: Image CDN (Cloudinary), lazy loading routes

### Server:
- ✅ Rate limiting configured
- ✅ Payload size limited
- Consider: Database indexing on frequently queried fields
- Consider: Redis caching for quotes/bookings

---

## Security Checklist

- ✅ HTTPS enforced (via platform or server code)
- ✅ CORS properly configured with CLIENT_URL
- ✅ JWT tokens validated on protected routes
- ✅ Rate limiting on sensitive endpoints
- ✅ Stripe data secure (never stored in DB)
- ✅ Admin endpoints require authentication
- ✅ Environment variables not commited to git
- ✅ Security headers added (X-Frame-Options, etc.)
- [ ] Regular security audits recommended
- [ ] Keep dependencies updated: `npm audit fix`

---

## Troubleshooting

### CORS Error
```
Check:
1. CLIENT_URL in server .env matches frontend domain
2. Credentials: true in client requests
3. API calls include proper headers
```

### Stripe Payment Fails
```
Check:
1. STRIPE_SECRET_KEY is live key (sk_live_)
2. Webhook secret configured correctly
3. Webhook IP whitelisted in Stripe
```

### Email Not Sending
```
Check:
1. SENDGRID_API_KEY is valid
2. Sender email is verified in SendGrid
3. Email provider environment variables set
4. Logs show email service initialization
```

### MongoDB Connection Error
```
Check:
1. MONGODB_URI format correct
2. IP address whitelisted in Atlas
3. Database user credentials valid
4. Network connectivity from deployment platform
```

---

## Deployment Commands Summary

```bash
# Build client
cd client && npm run build

# Test build locally
npm run preview

# Deploy server (varies by platform)
# Vercel: vercel --prod
# Railway: railway up
# Docker: docker build -t apex-cleaning . && docker run -it apex-cleaning
```

---

## Support & Next Steps

1. **Monitor first week** - Watch logs for errors
2. **Set up error tracking** - Sentry or similar
3. **Configure backups** - MongoDB Atlas automated backups
4. **Plan updates** - Keep dependencies updated
5. **Document changes** - Keep deployment docs current
