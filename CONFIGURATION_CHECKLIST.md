# Configuration Checklist - Apex Five Cleaning

Use this checklist to ensure all components are properly configured before deployment.

## 🔧 Pre-Deployment Configuration

### Server Environment Setup

#### Database Configuration
- [ ] MongoDB installed or Atlas account created
- [ ] MongoDB connection string ready
- [ ] Database selected (apex-cleaning)
- [ ] Collections auto-created on first run

#### SendGrid Setup
- [ ] SendGrid account created (https://sendgrid.com)
- [ ] API key generated
- [ ] Sender email verified
- [ ] Admin email address confirmed

#### Google reCAPTCHA v3
- [ ] reCAPTCHA account active (https://www.google.com/recaptcha/admin)
- [ ] Site created for your domain
- [ ] Site Key obtained
- [ ] Secret Key obtained
- [ ] Domain added to allowed list

#### Admin Configuration
- [ ] Secure ADMIN_TOKEN generated (use: `openssl rand -hex 32`)
- [ ] Admin email address defined
- [ ] Admin user has access

### Server .env File

```bash
cd server
cp .env.example .env
```

Then fill in these required fields:

- [ ] `PORT` = 5000 (or your preferred port)
- [ ] `NODE_ENV` = development (or production)
- [ ] `CLIENT_URL` = http://localhost:3000 (or your domain)
- [ ] `MONGODB_URI` = (local or Atlas connection string)
- [ ] `SENDGRID_API_KEY` = SG.xxxxxx
- [ ] `SENDGRID_FROM_EMAIL` = hello@apexfivecleaning.co.uk (verified in SendGrid)
- [ ] `ADMIN_EMAIL` = admin@apexfivecleaning.co.uk (admin notifications sent here)
- [ ] `ADMIN_TOKEN` = (secure random token)
- [ ] `RECAPTCHA_SECRET_KEY` = (from Google reCAPTCHA console)
- [ ] `RECAPTCHA_SITE_KEY` = (from Google reCAPTCHA console)

### Client .env File

```bash
cd client
cp .env.example .env
```

Then fill in:

- [ ] `VITE_RECAPTCHA_SITE_KEY` = (from Google reCAPTCHA console)

### Backend Dependencies

```bash
cd server
npm install
```

Verify installation:
- [ ] node_modules/ directory created
- [ ] package-lock.json generated
- [ ] All dependencies listed in package.json installed

### Frontend Dependencies

```bash
cd client
npm install
```

Verify installation:
- [ ] node_modules/ directory created
- [ ] package-lock.json generated
- [ ] All dependencies listed in package.json installed

## ✅ Testing Configuration

### Server Connection Test

Start server:
```bash
cd server
npm run dev
```

Should see:
- [ ] "✓ Connected to MongoDB"
- [ ] "✓ SendGrid initialized"
- [ ] "✓ Server running on http://localhost:5000"

Test endpoints:
```bash
# Health check
curl http://localhost:5000/api/health
```

Expected response:
```json
{ "status": "OK", "timestamp": "..." }
```

### Client Connection Test

Start client:
```bash
cd client
npm run dev
```

Should see:
- [ ] "Local: http://localhost:3000/"
- [ ] No console errors
- [ ] Page loads in browser

Test endpoints:
- [ ] Navigate to http://localhost:3000
- [ ] Go to /request-a-quote
- [ ] Form should load

### Database Connection Test

```bash
# If using local MongoDB
mongosh

# In MongoDB shell
use apex-cleaning
db.quotes.find()
```

Expected:
- [ ] Connected to database
- [ ] Collection exists (even if empty)

### Email Configuration Test

After successful quote submission:
- [ ] Check customer email for confirmation (check spam folder)
- [ ] Check admin email for notification
- [ ] Verify SendGrid activity log shows "Delivered"

## 🔐 Security Configuration

### Rate Limiting

In `server/src/middleware/rateLimiter.js`:

- [ ] Quote limiter: 5 per 24 hours (configurable)
- [ ] Email limiter: 3 per email per day (configurable)
- [ ] API limiter: 100 per 15 minutes (configurable)

To adjust: Edit the `max` and `windowMs` values, then restart server.

### CAPTCHA Configuration

In `server/src/middleware/captchaMiddleware.js`:

- [ ] CAPTCHA_SCORE_THRESHOLD = 0.5 (range 0.0-1.0)
- [ ] Higher = stricter (fewer false positives)
- [ ] Lower = looser (allows more bots)

### Validation Rules

In `server/src/utils/validation.js`:

- [ ] Email format: Valid RFC 5322
- [ ] Phone: UK format only (01xxx, +44)
- [ ] Names: 2-50 chars, letters/hyphens/apostrophes
- [ ] Address: 5-200 chars
- [ ] Bedrooms/Bathrooms: 1-20

To customize: Edit the Joi schema patterns.

## 📋 Pre-Launch Checklist

### Functionality
- [ ] Submit quote form works
- [ ] Validation errors display correctly
- [ ] reCAPTCHA loads on form
- [ ] Success message shows after submission
- [ ] Confirmation email received
- [ ] Admin notification email received

### Admin Dashboard
- [ ] Login with admin token works
- [ ] Quotes list displays correctly
- [ ] Pagination works
- [ ] Search functionality works
- [ ] Status filter works
- [ ] Can update quote status
- [ ] Can add admin notes
- [ ] CSV export downloads file

### Rate Limiting
- [ ] Submit 6 quotes from same IP
- [ ] 6th submission blocked with 429 error
- [ ] Wait 24 hours or clear browser cache to test again

### CAPTCHA
- [ ] reCAPTCHA v3 badge appears
- [ ] Form submits without CAPTCHA popup
- [ ] Low CAPTCHA scores are logged

### Error Handling
- [ ] Invalid email shows error
- [ ] Invalid phone shows error
- [ ] Missing required fields show errors
- [ ] Network error shows user-friendly message
- [ ] Server error shows generic message (not technical details)

### Mobile Testing
- [ ] Form responsive on mobile
- [ ] Admin dashboard responsive on mobile
- [ ] Form submits on mobile
- [ ] No horizontal scrolling

## 🌐 Domain & DNS (For Production)

### Domain Setup
- [ ] Domain purchased or prepared
- [ ] DNS records ready to configure
- [ ] SSL certificate ready (Let's Encrypt recommended)

### API Endpoint Configuration

Update when deploying:

**Server Configuration** (server/.env):
- [ ] `CLIENT_URL` = https://yourdomain.com

**Frontend Configuration** (client/vite.config.js):
Update proxy target to production server:
```javascript
'/api': {
  target: 'https://api.yourdomain.com',
  changeOrigin: true,
}
```

**reCAPTCHA Configuration**
- [ ] Add production domain to reCAPTCHA console
- [ ] Verify both localhost (dev) and production domain listed

**SendGrid Configuration**
- [ ] Verify production sender domain
- [ ] Update SENDGRID_FROM_EMAIL if different

## 📊 Monitoring Setup

### Server Monitoring
- [ ] PM2 installed: `npm install -g pm2`
- [ ] Process configured: `pm2 start src/index.js --name apex-api`
- [ ] Startup configured: `pm2 startup`
- [ ] Saved: `pm2 save`

### Database Monitoring
- [ ] MongoDB Atlas alerts configured (optional)
- [ ] Backup schedule configured (automated in Atlas)
- [ ] Connection monitoring enabled

### Email Monitoring
- [ ] SendGrid activity monitor bookmarked
- [ ] Bounce/spam tracking enabled
- [ ] Unsubscribe list monitored

### Error Tracking
- [ ] Server logs configured
- [ ] Error emails sent to admin
- [ ] Log rotation configured

## 🔄 Backup & Disaster Recovery

### Database Backups
- [ ] MongoDB Atlas backups enabled
- [ ] Backup frequency: Daily (minimum)
- [ ] Retention: 30 days (minimum)
- [ ] Test restore procedure

### Code Backups
- [ ] Git repository created
- [ ] Remote repository (GitHub) configured
- [ ] Main branch protected
- [ ] Commits tested before push

### Configuration Backups
- [ ] .env files securely stored
- [ ] API keys stored in secure vault
- [ ] Recovery procedure documented
- [ ] Emergency access plan created

## ✨ Production Readiness

### Performance
- [ ] Database indexes created
- [ ] Query performance optimized
- [ ] Load testing completed (optional)
- [ ] Caching strategy in place

### Documentation
- [ ] README.md reviewed
- [ ] QUICK_START.md tested
- [ ] DEPLOYMENT_GUIDE.md verified
- [ ] API documentation complete

### Support & Maintenance
- [ ] Support contact information added
- [ ] Maintenance schedule planned
- [ ] Update strategy defined
- [ ] Rollback procedure documented

## 📝 Sign-Off

After completing all items above:

- [ ] Configuration verified by developer
- [ ] Testing completed and passed
- [ ] Documentation reviewed
- [ ] Security checklist passed
- [ ] Team approval obtained
- [ ] Ready for production deployment

### Sign-Off Details
- **Date Completed**: _______________
- **Completed By**: _______________
- **Reviewed By**: _______________
- **Approved By**: _______________

---

## 🆘 Common Configuration Issues

### Issue: "Cannot connect to MongoDB"
**Solution:**
- Verify MONGODB_URI is correct
- Check MongoDB service is running
- If using Atlas, verify IP is whitelisted
- Check database name in connection string

### Issue: "reCAPTCHA not loading"
**Solution:**
- Verify VITE_RECAPTCHA_SITE_KEY in client .env
- Check domain is registered in reCAPTCHA console
- Clear browser cache
- Check browser console for errors

### Issue: "Email not sending"
**Solution:**
- Verify SENDGRID_API_KEY is correct
- Check sender email is verified in SendGrid
- Verify ADMIN_EMAIL is set
- Check SendGrid API status page

### Issue: "Rate limiting blocking legitimate users"
**Solution:**
- Check if user submitted multiple times
- Verify IP address detection is working
- Adjust rate limit thresholds if needed
- Check for VPN/proxy usage

### Issue: "Admin dashboard not loading"
**Solution:**
- Verify ADMIN_TOKEN is correct
- Check server is running
- Verify MongoDB connection
- Check browser console for errors
- Clear localStorage and try again

---

## ✅ Final Verification

Before going live:

```bash
# Backend health check
curl http://localhost:5000/api/health

# Frontend loads
curl http://localhost:3000

# Can submit quote
# Can access admin dashboard
# Email sending works
# Rate limiting works
# CAPTCHA works
```

All tests passed? **You're ready to deploy!** 🚀

---

**Last Updated**: January 2024  
**Created for**: Apex Five Cleaning v1.0.0
