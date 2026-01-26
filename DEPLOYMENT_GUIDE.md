# Installation & Deployment Guide

## System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **MongoDB**: 5.0+ (local or Atlas)
- **Git**: For version control

## Installation Steps

### 1. Clone/Setup Project

```bash
# If starting fresh
cd /Users/ayomi/apex-cleaning-website-build/apex-five-cleaning

# Verify structure
ls -la
# Should see: server/, client/, FEATURES_DOCUMENTATION.md, QUICK_START.md
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

### 3. Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with reCAPTCHA site key
nano .env
```

### 4. Database Setup

#### Option A: Local MongoDB

```bash
# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify it's running
mongosh  # Should connect successfully
```

#### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Create database user
4. Whitelist IP (0.0.0.0/0 for development)
5. Copy connection string
6. Add to server `.env`:
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/apex-cleaning?retryWrites=true&w=majority
   ```

### 5. Third-Party API Setup

#### SendGrid

1. Sign up at https://sendgrid.com
2. Go to Settings → API Keys
3. Click Create API Key
4. Choose "Full Access"
5. Copy key to server `.env` as `SENDGRID_API_KEY`
6. Verify sender email in Settings → Sender Authentication

#### Google reCAPTCHA v3

1. Go to https://www.google.com/recaptcha/admin
2. Click Create
3. Name: "Apex Five Cleaning"
4. Choose reCAPTCHA v3
5. Add domains: localhost, yourdomain.com
6. Accept terms and Submit
7. Copy keys:
   - Site Key → client `.env` as `VITE_RECAPTCHA_SITE_KEY`
   - Secret Key → server `.env` as `RECAPTCHA_SECRET_KEY`

## Running Locally

### Terminal 1: Backend

```bash
cd server
npm run dev
```

Expected output:
```
✓ Connected to MongoDB
✓ SendGrid initialized
✓ Server running on http://localhost:5000
```

### Terminal 2: Frontend

```bash
cd client
npm run dev
```

Expected output:
```
➜  Local:   http://localhost:3000/
```

### Test the Application

1. Open http://localhost:3000
2. Click "Request a Quote"
3. Fill out the form completely
4. Submit
5. Check confirmation email (check spam folder)
6. Go to http://localhost:3000/admin/quotes
7. Enter your ADMIN_TOKEN from .env
8. View the quote you just submitted

## Production Deployment

### Option 1: Deploy to Heroku

#### Backend Deployment

```bash
cd server

# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new app
heroku create apex-five-cleaning-api

# Set environment variables
heroku config:set PORT=5000
heroku config:set MONGODB_URI=your_atlas_uri
heroku config:set SENDGRID_API_KEY=your_key
heroku config:set SENDGRID_FROM_EMAIL=your_email
heroku config:set ADMIN_TOKEN=your_token
heroku config:set RECAPTCHA_SECRET_KEY=your_key
heroku config:set RECAPTCHA_SITE_KEY=your_key
heroku config:set CLIENT_URL=https://yourfrontendurl.com

# Deploy
git push heroku main
```

#### Frontend Deployment

Option A: Netlify
```bash
cd client

# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

Update vite.config.js to point to production API:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'https://apex-five-cleaning-api.herokuapp.com',
      changeOrigin: true,
    }
  }
}
```

Option B: Vercel
```bash
cd client

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variable
vercel env add VITE_RECAPTCHA_SITE_KEY
```

### Option 2: Deploy to AWS

#### Backend (Elastic Beanstalk)

```bash
cd server

# Install AWS CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 apex-five-cleaning

# Create environment
eb create production

# Set environment variables
eb setenv \
  MONGODB_URI=your_uri \
  SENDGRID_API_KEY=your_key \
  SENDGRID_FROM_EMAIL=your_email \
  ADMIN_TOKEN=your_token \
  RECAPTCHA_SECRET_KEY=your_key \
  CLIENT_URL=https://yourdomain.com

# Deploy
eb deploy
```

#### Frontend (S3 + CloudFront)

```bash
cd client

# Build
npm run build

# Create S3 bucket
aws s3 mb s3://apex-five-cleaning-website

# Upload
aws s3 sync dist/ s3://apex-five-cleaning-website --delete

# Create CloudFront distribution in AWS Console
```

### Option 3: Deploy to DigitalOcean

#### Setup Server

1. Create Ubuntu 22.04 droplet
2. SSH into server
3. Install Node.js and MongoDB

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
sudo apt-get install -y mongodb

# Install PM2
sudo npm install -g pm2
```

#### Deploy Backend

```bash
# Clone repo or upload code
git clone your-repo.git
cd apex-five-cleaning/server

# Install dependencies
npm install

# Create .env
cp .env.example .env
# Edit .env with production values

# Start with PM2
pm2 start src/index.js --name "apex-api"
pm2 save
pm2 startup
```

#### Deploy Frontend

```bash
cd ../client

# Install dependencies
npm install

# Build
npm run build

# Install nginx
sudo apt-get install -y nginx

# Copy build to nginx
sudo cp -r dist/* /var/www/html/

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Environment Configuration Checklist

### Server (.env)

```
PORT=5000
NODE_ENV=production
CLIENT_URL=https://yourdomain.com

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/apex-cleaning
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=hello@apexfivecleaning.co.uk
ADMIN_EMAIL=admin@apexfivecleaning.co.uk
ADMIN_TOKEN=secure_random_token_here
RECAPTCHA_SECRET_KEY=xxxxx
RECAPTCHA_SITE_KEY=xxxxx
```

### Client (.env)

```
VITE_RECAPTCHA_SITE_KEY=xxxxx
```

## SSL/TLS Certificate Setup

### Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Update Nginx

```bash
sudo nano /etc/nginx/sites-available/default
```

Add:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
}
```

## Monitoring & Logging

### PM2 Monitoring

```bash
# View logs
pm2 logs apex-api

# Monitor processes
pm2 monit

# Get status
pm2 status
```

### Database Backups

```bash
# MongoDB Atlas backup (automatic, free tier)
# Done automatically in Atlas Dashboard

# Local backup
mongodump --out /backup/mongo-backup-$(date +%Y%m%d)

# Restore
mongorestore /backup/mongo-backup-20240101
```

### Application Monitoring

Consider adding:
- **Sentry**: Error tracking (https://sentry.io)
- **New Relic**: Performance monitoring
- **Datadog**: Infrastructure monitoring

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Backend update
cd server
npm install
npm run build  # If using TypeScript
pm2 restart apex-api

# Frontend update
cd ../client
npm install
npm run build
# Deploy to hosting

# Restart services
pm2 restart all
```

## Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| CORS errors | Check CLIENT_URL in server .env |
| 502 Bad Gateway | Check if backend is running: `pm2 logs` |
| Blank page | Check console for JS errors |
| API not responding | Verify firewall allows port 5000 |
| Email not sending | Check SendGrid key and whitelist domains |
| Database connection | Verify MONGODB_URI and IP whitelist (Atlas) |

## Performance Optimization

### Frontend

```bash
# Build optimization
npm run build

# Analyze bundle
npm install -g webpack-bundle-analyzer
```

### Backend

- Enable gzip compression
- Set up Redis for caching
- Use CDN for static assets
- Implement database query optimization

### Database

```javascript
// Create indexes for common queries
db.quotes.createIndex({ email: 1, createdAt: -1 })
db.quotes.createIndex({ status: 1, createdAt: -1 })
```

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure ADMIN_TOKEN (long, random)
- [ ] Restrict MongoDB access by IP
- [ ] Use environment variables (never hardcode secrets)
- [ ] Enable CORS only for your domain
- [ ] Keep dependencies updated: `npm audit fix`
- [ ] Monitor error logs regularly
- [ ] Set up automated backups
- [ ] Use strong database passwords
- [ ] Implement rate limiting (already done)
- [ ] Validate all inputs (already done)
- [ ] Use reCAPTCHA (already done)

## Rollback Plan

If deployment fails:

```bash
# Check recent deployments
git log --oneline -10

# Revert to previous version
git revert HEAD
git push origin main

# Or revert specific file
git checkout HEAD~1 -- server/src/index.js
git commit -m "Rollback: revert to previous index.js"
```

---

**Deployment Complete!** 🎉  
Your production system is now secure, monitored, and ready to serve customers.
