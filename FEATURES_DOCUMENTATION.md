# Apex Five Cleaning - Enhanced Features Implementation

This document outlines all the features added to enhance the quote system with validation, security, email integration, and admin dashboard.

## Features Implemented

### 1. **Stronger Field-Specific Validation**

#### Client-Side Validation (Quote.jsx)
- Email validation with proper format checking
- UK phone number validation (supports 01xxx and +44 formats)
- Name validation (min 2 chars, letters/hyphens/apostrophes only)
- Address validation (min 5 chars)
- Number validation for bedrooms/bathrooms (1-20)
- Real-time error feedback with user-friendly messages
- Conditional error styling on input fields

#### Server-Side Validation (server/src/utils/validation.js)
- Uses Joi schema validation for all fields
- Comprehensive error messages for each field
- Custom validation patterns for UK phone numbers
- Data sanitization (email lowercasing, phone formatting)
- Prevents malformed data from reaching the database

### 2. **Rate-Limiting & Spam Protection**

#### Rate Limiting Implementation (server/src/middleware/rateLimiter.js)
- **Quote Rate Limiter**: Maximum 5 quote submissions per IP per 24 hours
- **Email Rate Limiter**: Maximum 3 submissions per email address per day
- **General API Limiter**: 100 requests per 15 minutes per IP
- **Strict Limiter**: 5 requests per hour for sensitive endpoints
- Admin bypasses rate limiting with valid token
- Graceful error messages when limits are exceeded

#### reCAPTCHA v3 Integration (server/src/middleware/captchaMiddleware.js)
- Silent verification (no user interaction required)
- Configurable score threshold (default 0.5, range 0-1)
- Detects and blocks bot submissions
- Logs CAPTCHA scores for admin review
- Automatic token verification with Google's API

### 3. **Email Integration with SendGrid**

#### Email Templates (server/src/utils/emailService.js)
- **Client Confirmation Email**: Professional HTML template with quote reference
- **Admin Notification Email**: Detailed quote information with all property/service details
- Full email templating with responsive design
- Automatic sending on successful quote submission

#### Email Service Features
- SendGrid API integration for reliable delivery
- HTML and plain text fallbacks
- Customizable from address and admin email
- Error handling with retry logic
- Email status tracking in database

### 4. **Admin Dashboard & Management System**

#### Admin Dashboard (client/src/pages/AdminDashboard.jsx)
- **Quote Management**
  - View all submitted quotes with pagination
  - Filter by status (New, Contacted, Converted, Rejected)
  - Search by name, email, or phone
  - Configurable items per page (10, 20, 50, 100)

- **Statistics Dashboard**
  - Total quotes count
  - Breakdown by status
  - Recent activity (last 7 days)
  - Service type distribution

- **Quote Details Modal**
  - View complete quote information
  - Customer details
  - Property specifications
  - Service requirements
  - Update status and add admin notes
  - CAPTCHA verification scores

- **CSV Export**
  - Export all quotes to CSV format
  - Filterable by status and date range
  - Includes all quote details
  - Automatic file download

- **Secure Access**
  - Token-based authentication
  - Persistent session storage (localStorage)
  - Logout functionality
  - Protected endpoints

#### Admin API Endpoints (server/src/routes/admin.js)
- `GET /api/admin/quotes` - List quotes with filtering and pagination
- `GET /api/admin/quotes/:id` - Get single quote details
- `PATCH /api/admin/quotes/:id` - Update quote status and notes
- `GET /api/admin/export/csv` - Export quotes as CSV
- `GET /api/admin/stats` - Get dashboard statistics

### 5. **Database Model (Quote)**

The Quote model (server/src/models/Quote.js) stores:
- Customer Information (name, email, phone, address)
- Property Details (type, bedrooms, bathrooms)
- Service Type (residential, end-of-tenancy, airbnb, commercial)
- CAPTCHA verification data (score, verified status)
- Security Information (IP address for tracking)
- Status tracking (new, contacted, converted, rejected)
- Admin notes and email delivery status
- Timestamps for all submissions

## Setup Instructions

### 1. Backend Server Setup

```bash
cd apex-five-cleaning/server
npm install
```

#### Environment Configuration (.env)
Create a `.env` file in the server directory using `.env.example` as a template:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/apex-cleaning

# SendGrid Email
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=hello@apexfivecleaning.co.uk

# Admin
ADMIN_EMAIL=admin@apexfivecleaning.co.uk
ADMIN_TOKEN=your_secure_token_here

# reCAPTCHA
RECAPTCHA_SECRET_KEY=your_secret_key_here
RECAPTCHA_SITE_KEY=your_site_key_here
```

#### Start the Server
```bash
npm run dev  # Development with nodemon
npm start    # Production
```

The server will run on `http://localhost:5000`

### 2. Frontend Setup

#### Environment Configuration (.env)
Create a `.env` file in the client directory:

```env
VITE_RECAPTCHA_SITE_KEY=your_site_key_here
```

#### Install and Run
```bash
cd apex-five-cleaning/client
npm install
npm run dev
```

The client will run on `http://localhost:3000`

### 3. Database Setup

#### MongoDB Installation
- Install MongoDB Community Edition locally or use MongoDB Atlas (cloud)
- For local: Start MongoDB service
- For Atlas: Create a cluster and get connection string

#### Database Initialization
Collections are auto-created on first quote submission. No manual setup needed.

### 4. Third-Party Services

#### SendGrid Setup
1. Create an account at https://sendgrid.com
2. Generate API key in Settings > API Keys
3. Create sender email in Settings > Sender Authentication
4. Add credentials to `.env` file

#### Google reCAPTCHA v3
1. Go to https://www.google.com/recaptcha/admin
2. Create new site for your domain
3. Copy Site Key and Secret Key
4. Add to both client `.env` and server `.env`

### 5. Admin Dashboard Access

1. Navigate to `http://localhost:3000/admin/quotes`
2. Enter the admin token (from `ADMIN_TOKEN` in .env)
3. Dashboard will load with all quotes and statistics

## API Documentation

### Quote Submission Endpoint

**POST** `/api/quotes/submit`

```json
{
  "propertyType": "house|flat|bungalow",
  "bedrooms": number,
  "bathrooms": number,
  "serviceType": "residential|end-of-tenancy|airbnb|commercial",
  "firstName": string,
  "lastName": string,
  "email": string,
  "phone": string,
  "address": string,
  "additionalNotes": string (optional),
  "captchaToken": string
}
```

**Response (Success - 201)**
```json
{
  "success": true,
  "message": "Quote request submitted successfully...",
  "quoteId": "mongodb_object_id"
}
```

**Response (Validation Error - 400)**
```json
{
  "success": false,
  "errors": {
    "email": "Please enter a valid email address",
    "phone": "Please enter a valid UK phone number..."
  }
}
```

**Response (Rate Limit - 429)**
```json
{
  "success": false,
  "error": "You have reached the maximum number of quote requests..."
}
```

### Admin Endpoints

All admin endpoints require: `Authorization: Bearer <ADMIN_TOKEN>`

**GET** `/api/admin/quotes?status=new&page=1&limit=20&search=query`
- Filter by status (new, contacted, converted, rejected, all)
- Pagination support
- Full-text search

**PATCH** `/api/admin/quotes/:id`
```json
{
  "status": "contacted|converted|rejected",
  "adminNotes": "string"
}
```

**GET** `/api/admin/export/csv?status=all&dateFrom=2024-01-01&dateTo=2024-12-31`
- Returns CSV file with all quote data

**GET** `/api/admin/stats`
- Returns dashboard statistics

## Error Handling

### Client-Side
- Form validation errors displayed below each field
- Submit errors shown in alert box
- Network errors with retry guidance
- User-friendly error messages (no technical jargon)

### Server-Side
- Comprehensive validation with Joi
- Rate limit messages with retry timing
- CAPTCHA verification failures with clear feedback
- Database errors logged but generic response to client
- All errors use consistent JSON format

## Security Features

1. **reCAPTCHA v3**: Silent bot detection
2. **Rate Limiting**: IP and email-based throttling
3. **Input Validation**: Both client and server-side
4. **Data Sanitization**: Normalization of phone/email
5. **Admin Authentication**: Token-based access control
6. **Duplicate Detection**: Prevents accidental resubmissions
7. **IP Tracking**: Logs IP address for fraud detection
8. **CAPTCHA Scoring**: Stores suspicious activity indicators

## Testing the Features

### 1. Test Quote Submission
```bash
# Submit a valid quote
curl -X POST http://localhost:5000/api/quotes/submit \
  -H "Content-Type: application/json" \
  -d '{
    "propertyType": "house",
    "bedrooms": 3,
    "bathrooms": 2,
    "serviceType": "residential",
    "firstName": "John",
    "lastName": "Smith",
    "email": "john@example.com",
    "phone": "01234 567890",
    "address": "123 Main St, London",
    "captchaToken": "token_here"
  }'
```

### 2. Test Rate Limiting
Submit 6 quotes from the same IP - the 6th should fail with 429 status

### 3. Test Email Validation
Submit with invalid email - should return validation error

### 4. Test Phone Validation
Try various UK phone formats:
- ✓ 01234 567890
- ✓ +44 1234 567890
- ✓ 07700 900123
- ✗ Invalid formats should be rejected

### 5. Access Admin Dashboard
1. Go to `/admin/quotes`
2. Enter your admin token
3. Verify all quotes appear
4. Test CSV export
5. Update a quote status

## Troubleshooting

### SendGrid Email Not Sending
- Verify API key in .env
- Check sender email is verified in SendGrid
- Check admin email in .env
- Look for errors in server console

### reCAPTCHA Not Loading
- Verify site key in .env
- Check domain is added to reCAPTCHA console
- Clear browser cache
- Check browser console for errors

### Rate Limiting Too Strict
- Adjust `max` values in rateLimiter.js
- Modify `windowMs` for time window
- Restart server after changes

### Admin Dashboard Not Loading
- Verify token is correct
- Check server is running
- Verify MongoDB connection
- Check browser console for errors
- Ensure admin token is set in .env

### Database Connection Issues
- Verify MongoDB is running locally or Atlas connection is valid
- Check MONGODB_URI in .env
- Verify network access (for Atlas)
- Check MongoDB service status

## Performance Optimization

1. **Database Indexing**: Quotes are indexed on email and status for fast queries
2. **Pagination**: Large datasets paginated to reduce load
3. **CSV Streaming**: Files streamed for large exports
4. **Rate Limiting**: Prevents database abuse from malicious requests
5. **CAPTCHA Caching**: Reduced API calls with proper token validation

## Future Enhancements

1. Two-factor authentication for admin access
2. Quote templates for faster admin responses
3. Automated email follow-ups
4. Quote expiration and archival
5. Admin user management system
6. Quote comparison reports
7. Customer portal for quote tracking
8. Integration with accounting systems

## Support

For issues or questions, please check:
- Server logs for debugging
- Browser DevTools console for client errors
- MongoDB logs for database issues
- SendGrid dashboard for email delivery status

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Created for**: Apex Five Cleaning Website v2.0
