# Quick Start Guide - Apex Five Cleaning Enhanced Features

## Prerequisites
- Node.js 18+ installed
- MongoDB (local or Atlas)
- SendGrid account
- Google reCAPTCHA v3 keys

## 5-Minute Setup

### Step 1: Install Dependencies

```bash
# Terminal 1 - Backend
cd apex-five-cleaning/server
npm install

# Terminal 2 - Frontend (in a new terminal)
cd apex-five-cleaning/client
npm install
```

### Step 2: Get API Keys

**Google reCAPTCHA v3**
1. Go to https://www.google.com/recaptcha/admin
2. Click "Create" or "+" button
3. Select reCAPTCHA v3
4. Add your domain
5. Copy Site Key and Secret Key

**SendGrid**
1. Go to https://sendgrid.com (sign up if needed)
2. Settings > API Keys > Create API Key
3. Copy the API Key

### Step 3: Configure Environment Files

**Server (.env)**
```bash
cd apex-five-cleaning/server
cp .env.example .env
```

Edit `.env` and add:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb://localhost:27017/apex-cleaning
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/apex-cleaning

SENDGRID_API_KEY=SG.your_api_key_here
SENDGRID_FROM_EMAIL=hello@apexfivecleaning.co.uk

ADMIN_EMAIL=admin@apexfivecleaning.co.uk
ADMIN_TOKEN=choose_a_secure_token_like_abcdef123456

RECAPTCHA_SECRET_KEY=your_secret_key_from_google
RECAPTCHA_SITE_KEY=your_site_key_from_google
```

**Client (.env)**
```bash
cd apex-five-cleaning/client
cp .env.example .env
```

Edit `.env` and add:
```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_from_google
```

### Step 4: Start Services

**Terminal 1 - MongoDB** (if using local)
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or use MongoDB Atlas (skip this if using cloud)
```

**Terminal 2 - Backend**
```bash
cd apex-five-cleaning/server
npm run dev
```

You should see:
```
✓ Connected to MongoDB
✓ SendGrid initialized
✓ Server running on http://localhost:5000
```

**Terminal 3 - Frontend**
```bash
cd apex-five-cleaning/client
npm run dev
```

You should see:
```
➜  Local:   http://localhost:3000/
```

### Step 5: Test It Out

1. **Quote Form**: Go to http://localhost:3000/request-a-quote
   - Fill out the form
   - Should submit successfully and show confirmation
   - Check email for confirmation message

2. **Admin Dashboard**: Go to http://localhost:3000/admin/quotes
   - Enter the admin token you set in .env
   - Should see your quote in the list
   - Test updating status and exporting CSV

## Key Features Quick Reference

### ✅ Validation
- Email format validation
- UK phone number validation
- Name and address validation
- Real-time error messages

### ✅ Security
- reCAPTCHA v3 spam protection
- Rate limiting (5 quotes per IP per 24h)
- Email-based rate limiting (3 per email per day)
- Duplicate submission detection

### ✅ Email
- Automatic confirmation to customer
- Notification to admin
- Professional HTML templates
- Error tracking

### ✅ Admin Dashboard
- View all quotes
- Filter by status
- Search functionality
- Update status and add notes
- Export to CSV
- View statistics

## Testing Scenarios

### Test 1: Valid Submission
```
Property: House
Bedrooms: 3
Bathrooms: 2
Service: Residential Cleaning
Name: John Smith
Email: test@example.com
Phone: 01234 567890
Address: 123 Main St, London
```
**Expected**: Success with confirmation email

### Test 2: Validation Errors
- Leave email blank → Error appears
- Enter invalid phone → Error appears
- Enter short name → Error appears

### Test 3: Rate Limiting
- Submit 6 quotes from same browser → 6th blocked
- Wait 24 hours OR use different IP/email

### Test 4: Admin Features
- Login with admin token
- See quotes
- Change status to "Contacted"
- Export as CSV

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find MongoDB" | Make sure MongoDB is running: `brew services start mongodb-community` |
| "reCAPTCHA not loading" | Check Site Key in .env matches Google console |
| "Email not sending" | Verify SendGrid API key and sender email |
| "Admin dashboard blank" | Check admin token matches .env ADMIN_TOKEN |
| "Port 5000 in use" | Change PORT in server .env |
| "Port 3000 in use" | Change port in vite.config.js |

## Environment Variables Checklist

### Server (.env) - Must Have
- [ ] PORT
- [ ] MONGODB_URI
- [ ] SENDGRID_API_KEY
- [ ] SENDGRID_FROM_EMAIL
- [ ] ADMIN_TOKEN
- [ ] RECAPTCHA_SECRET_KEY

### Client (.env) - Must Have
- [ ] VITE_RECAPTCHA_SITE_KEY

## File Structure Reference

```
apex-five-cleaning/
├── server/
│   ├── src/
│   │   ├── models/      # Quote database model
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Rate limiting, CAPTCHA
│   │   ├── utils/       # Validation, emails
│   │   └── index.js     # Main server file
│   ├── .env.example
│   └── package.json
└── client/
    ├── src/
    │   ├── pages/
    │   │   ├── Quote.jsx          # Quote form with validation
    │   │   └── AdminDashboard.jsx # Admin interface
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example
    └── vite.config.js
```

## Next Steps

1. **Customize Email Templates**: Edit `server/src/utils/emailService.js`
2. **Adjust Rate Limits**: Edit `server/src/middleware/rateLimiter.js`
3. **Add More Validation**: Edit `server/src/utils/validation.js`
4. **Customize Admin UI**: Edit `client/src/pages/AdminDashboard.jsx`
5. **Deploy**: Follow deployment guide for production

## Support Resources

- **Backend Issues**: Check server terminal output
- **Frontend Issues**: Check browser console (F12)
- **Database**: Check MongoDB Atlas dashboard
- **Email**: Check SendGrid Activity Feed
- **reCAPTCHA**: Check Google reCAPTCHA console

---

**Good luck! 🚀**  
Your quote system is now production-ready with enterprise-grade security and validation.
