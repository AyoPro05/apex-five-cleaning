# Visual Architecture & Flow Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (React + Vite)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────────┐   │
│  │  Quote Form      │              │ Admin Dashboard      │   │
│  │  - Validation    │              │ - List Quotes        │   │
│  │  - Error Msgs    │              │ - Filter/Search      │   │
│  │  - CAPTCHA       │              │ - Update Status      │   │
│  │  - Submit API    │              │ - CSV Export         │   │
│  └────────┬─────────┘              └──────────┬───────────┘   │
│           │                                   │                │
│           └─────────────┬─────────────────────┘                │
│                         │ HTTP Requests                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
              ┌───────────┴────────────┐
              │                        │
              ▼                        ▼
        ┌────────────────┐     ┌──────────────┐
        │ /api/quotes    │     │ /api/admin   │
        │ (Quote Routes) │     │ (Admin Routes)
        └────────────────┘     └──────────────┘
              │                        │
              └───────────┬────────────┘
                          │
┌─────────────────────────┴────────────────────────────────────────┐
│              SERVER (Node.js + Express)                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Middleware Layer                                        │   │
│  │ ┌──────────────┐  ┌──────────────┐  ┌─────────────┐   │   │
│  │ │ CORS         │  │ Rate Limiter │  │ CAPTCHA     │   │   │
│  │ │ & Payload    │  │ - IP based   │  │ - Verify    │   │   │
│  │ │ Validation   │  │ - Email      │  │ - Score     │   │   │
│  │ └──────────────┘  │   based      │  │ - Log       │   │   │
│  │                   └──────────────┘  └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Route Handlers                                          │   │
│  │ ┌─────────────────┐         ┌─────────────────────┐   │   │
│  │ │ Quote Routes    │         │ Admin Routes        │   │   │
│  │ │ - POST submit   │         │ - GET list          │   │   │
│  │ │ - GET detail    │         │ - PATCH update      │   │   │
│  │ └────────┬────────┘         │ - GET export CSV    │   │   │
│  │          │                  │ - GET stats         │   │   │
│  │          │                  └────────┬────────────┘   │   │
│  │          │                           │                │   │
│  └──────────┼───────────────────────────┼────────────────┘   │
│             │                           │                    │
│             ▼                           ▼                    │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │ Validation Utils     │  │ Email Service            │   │
│  │ - Joi Schemas        │  │ - SendGrid Integration   │   │
│  │ - Field Rules        │  │ - Confirmation Template  │   │
│  │ - Sanitization       │  │ - Admin Notification     │   │
│  │ - Error Messages     │  │ - Error Handling         │   │
│  └──────────────────────┘  └──────────────────────────┘   │
│             │                           │                    │
│             └────────────┬──────────────┘                    │
│                          │                                   │
│             ┌────────────┼────────────┐                     │
│             ▼            ▼            ▼                     │
│  ┌────────────────────────────────────────────┐            │
│  │         Data Models Layer                  │            │
│  │  ┌──────────┐  ┌──────────────────────┐  │            │
│  │  │ Quote    │  │ MongoDB Connection   │  │            │
│  │  │ Model    │  │ - Connection Pool    │  │            │
│  │  │ Schema   │  │ - Query Optimization │  │            │
│  │  └──────────┘  │ - Indexes            │  │            │
│  └────────────────────────────────────────────┘            │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│ EXTERNAL SERVICES                                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ MongoDB Atlas  │  │ SendGrid     │  │ reCAPTCHA v3  │  │
│  │ - Persistence  │  │ - Email      │  │ - Bot Check   │  │
│  │ - Backup       │  │ - Delivery   │  │ - Scoring     │  │
│  │ - Indexing     │  │ - Tracking   │  │ - Logging     │  │
│  └────────────────┘  └──────────────┘  └───────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Quote Submission Flow

```
USER INPUT
    │
    ▼
CLIENT VALIDATION
    ├─ Email format? ✓
    ├─ Phone format? ✓
    ├─ Names valid? ✓
    ├─ Address length? ✓
    └─ All required fields? ✓
    │
    ▼ (if validation fails → show error, stop)
    │
GET reCAPTCHA TOKEN
    │
    ▼
SEND TO SERVER
    POST /api/quotes/submit
    {
      propertyType, bedrooms, bathrooms,
      serviceType, firstName, lastName,
      email, phone, address, captchaToken
    }
    │
    ▼
SERVER RATE LIMIT CHECK
    ├─ IP limited? (5 per 24h)
    ├─ Email limited? (3 per day)
    └─ → if limited: return 429 error
    │
    ▼ (if rate limited)
CAPTCHA VERIFICATION
    ├─ Verify token with Google
    ├─ Check score threshold (0.5)
    └─ → if bot: return 429 error
    │
    ▼
SERVER-SIDE VALIDATION
    ├─ Validate all fields again
    ├─ Sanitize data
    └─ → if invalid: return 400 errors
    │
    ▼
DUPLICATE CHECK (5 min window)
    ├─ Recent submission from this email?
    └─ → if duplicate: return 409 error
    │
    ▼
SAVE TO DATABASE
    ├─ Create Quote document
    ├─ Set status: "new"
    └─ Log timestamp & IP
    │
    ▼
SEND EMAILS
    ├─ Customer confirmation
    │   └─ Quote reference included
    │
    └─ Admin notification
        └─ Full quote details + CAPTCHA score
    │
    ▼
RETURN SUCCESS
    {
      success: true,
      message: "...",
      quoteId: "..."
    }
    │
    ▼
USER SUCCESS MESSAGE
    └─ Display quote ID for reference
```

### Admin Quote Management Flow

```
ADMIN LOGIN
    │
    ▼
ENTER ADMIN TOKEN
    │
    ▼
VERIFY TOKEN
    └─ Compare with server ADMIN_TOKEN
    │
    ▼ (if invalid → show error)
GET QUOTES LIST
    │
    ▼
APPLY FILTERS
    ├─ Status filter (new/contacted/etc)
    ├─ Search filter (name/email/phone)
    ├─ Pagination (page, limit)
    └─ Sorting (date, etc)
    │
    ▼
FETCH FROM DB
    ├─ Query with indexes
    └─ Return paginated results
    │
    ▼
DISPLAY QUOTES TABLE
    └─ Show in admin dashboard
    │
    ▼
SELECT QUOTE TO EDIT
    │
    ▼
OPEN QUOTE DETAILS MODAL
    ├─ Display all information
    ├─ Show CAPTCHA score
    └─ Allow status/notes edit
    │
    ▼
UPDATE QUOTE
    │
    ▼
PATCH /api/admin/quotes/:id
    {
      status: "contacted",
      adminNotes: "..."
    }
    │
    ▼
VERIFY ADMIN TOKEN
    │
    ▼ (if invalid → return 401)
UPDATE IN DATABASE
    │
    ▼
RETURN SUCCESS
    │
    ▼
REFRESH QUOTE IN UI
    │
    ▼
EXPORT TO CSV
    │
    ▼
APPLY FILTERS
    └─ By status, date range
    │
    ▼
GET /api/admin/export/csv
    │
    ▼
QUERY DATABASE
    │
    ▼
FORMAT AS CSV
    └─ Headers + data rows
    │
    ▼
SEND FILE
    ├─ Content-Type: text/csv
    └─ Content-Disposition: attachment
    │
    ▼
DOWNLOAD FILE
    └─ quotes_export_2024-01-26.csv
```

---

## Rate Limiting Visualization

```
REQUEST 1 ────┐
REQUEST 2 ────┤
REQUEST 3 ────├──► Rate Limiter Check ──► ALLOWED ──► Process
REQUEST 4 ────┤
REQUEST 5 ────┘ (5 per 24 hours per IP)
    │
    ▼ (24 hours later, counter resets)
REQUEST 6 ────┐
REQUEST 7 ────├──► NEW 24h window starts
    │
    └──► REQUEST 6 (from different IP) ──► ALLOWED
    │
    └──► REQUEST 6 (from same email) ──┐
         + REQUEST 7 (same email)    ├──► Email Limiter
         + REQUEST 8 (same email)    │    (3 per day)
         + REQUEST 9 (same email) ───┘
    │
    ▼
REQUEST 9 ──► BLOCKED (429 - Too Many Requests)
         └──► "Max 3 quotes per email per day"
```

---

## Database Schema Relationship

```
MongoDB
  └── apex-cleaning (database)
       └── quotes (collection)
            │
            ├── _id: ObjectId
            │
            ├── Property Details
            │   ├── propertyType: String
            │   ├── bedrooms: Number
            │   └── bathrooms: Number
            │
            ├── Service Details
            │   ├── serviceType: String
            │   └── additionalNotes: String
            │
            ├── Contact Info
            │   ├── firstName: String
            │   ├── lastName: String
            │   ├── email: String
            │   ├── phone: String
            │   └── address: String
            │
            ├── Security
            │   ├── captchaScore: Number (0-1)
            │   ├── captchaVerified: Boolean
            │   └── ipAddress: String
            │
            ├── Status Management
            │   ├── status: String (enum)
            │   └── adminNotes: String
            │
            ├── Email Tracking
            │   ├── confirmationEmailSent: Boolean
            │   └── adminEmailSent: Boolean
            │
            └── Timestamps
                ├── createdAt: DateTime
                └── updatedAt: DateTime

Indexes:
  • email + createdAt (for duplicate detection & queries)
  • status + createdAt (for filtering)
```

---

## Authentication Flow

```
ADMIN ACCESS
    │
    ▼
ENTER ADMIN TOKEN
    └─ Stored in localStorage
    │
    ▼
REQUEST TO /api/admin/*
    │
    ▼
ADD HEADER
    Authorization: Bearer <token>
    │
    ▼
SERVER RECEIVES REQUEST
    │
    ▼
CHECK HEADER
    ├─ Header present?
    ├─ Format correct?
    └─ Token matches ADMIN_TOKEN in .env?
    │
    ▼ (if invalid → return 401)
ALLOW REQUEST
    │
    ▼
PROCESS QUERY
    └─ List/update/export quotes
```

---

## Error Handling Path

```
ERROR OCCURS
    │
    ├─ VALIDATION ERROR
    │   └─ 400 Bad Request
    │       └─ Return field errors: {email: "Invalid format", ...}
    │
    ├─ RATE LIMIT ERROR
    │   └─ 429 Too Many Requests
    │       └─ Return: "Max 5 per 24 hours"
    │
    ├─ AUTHENTICATION ERROR
    │   └─ 401 Unauthorized
    │       └─ Return: "Unauthorized"
    │
    ├─ NOT FOUND ERROR
    │   └─ 404 Not Found
    │       └─ Return: "Quote not found"
    │
    ├─ SERVER ERROR
    │   └─ 500 Internal Server Error
    │       └─ Log error, return generic message
    │
    └─ NETWORK ERROR
        └─ Show user-friendly message
            └─ "A network error occurred..."

CLIENT HANDLING
    │
    ├─ Show error in alert/notification
    ├─ Highlight invalid fields
    ├─ Provide next steps
    └─ Don't expose technical details
```

---

## Email Template Flowchart

```
QUOTE SUBMITTED
    │
    ├────────────────────────────────────┐
    │                                    │
    ▼                                    ▼
SEND CUSTOMER EMAIL              SEND ADMIN EMAIL
    │                                    │
    ├─ Welcome message             ├─ Quote details
    ├─ Quote reference ID          ├─ Customer info
    ├─ Next steps                  ├─ Property specs
    ├─ Contact info                ├─ CAPTCHA score
    ├─ Professional branding       ├─ Link to dashboard
    │                              └─ Admin portal access
    ▼                                    ▼
HTML EMAIL TEMPLATE            HTML EMAIL TEMPLATE
    │                                    │
    ├─ Responsive design          ├─ Detailed layout
    ├─ Fallback text              ├─ Organized sections
    └─ Links to website           └─ Call-to-action links
    │                                    │
    ▼                                    ▼
SendGrid API                        SendGrid API
    │                                    │
    ├─ Verify recipient          ├─ Verify recipient
    ├─ Queue message             ├─ Queue message
    ├─ Send via SMTP             ├─ Send via SMTP
    │                                    │
    ▼                                    ▼
DELIVERED                          DELIVERED
    │                                    │
    ├─ Track in SendGrid dashboard
    ├─ Log status in database
    └─ Update confirmationEmailSent flag
```

---

## CAPTCHA Verification Process

```
FORM SUBMITTED
    │
    ▼
GET reCAPTCHA TOKEN
    └─ window.grecaptcha.execute()
    │
    ▼
SEND TOKEN WITH FORM DATA
    │
    ▼
SERVER RECEIVES TOKEN
    │
    ▼
VERIFY WITH GOOGLE
    └─ POST to https://www.google.com/recaptcha/api/siteverify
       Parameters:
       - secret: RECAPTCHA_SECRET_KEY
       - response: token
    │
    ▼
GOOGLE RESPONSE
    {
      "success": true,
      "score": 0.85,     // 0.0 = bot, 1.0 = human
      "action": "submit"
    }
    │
    ▼
CHECK SCORE
    ├─ score >= 0.5?  YES ──► CONTINUE
    └─ score < 0.5?   NO  ──► BLOCK (429)
    │
    ▼
SAVE CAPTCHA DATA
    ├─ Store score in database
    ├─ Mark as verified
    └─ Log for admin review
    │
    ▼
PROCEED WITH SUBMISSION
```

---

## Frontend Component Structure

```
App.jsx
  ├─ Routes
  │   ├─ Home
  │   ├─ Services
  │   ├─ About
  │   ├─ Contact
  │   │
  │   ├─ Quote (ENHANCED)
  │   │   ├─ State Management
  │   │   │   ├─ formData (form fields)
  │   │   │   ├─ errors (validation errors)
  │   │   │   ├─ step (form step)
  │   │   │   ├─ submitting (loading state)
  │   │   │   └─ success (completion)
  │   │   │
  │   │   ├─ Step 1: Property Details
  │   │   │   ├─ Property Type (select)
  │   │   │   ├─ Bedrooms (number)
  │   │   │   └─ Bathrooms (number)
  │   │   │
  │   │   ├─ Step 2: Service Type
  │   │   │   ├─ Service Type (select)
  │   │   │   └─ Additional Notes (textarea)
  │   │   │
  │   │   ├─ Step 3: Contact Info
  │   │   │   ├─ First Name (text, validation)
  │   │   │   ├─ Last Name (text, validation)
  │   │   │   ├─ Email (email, validation)
  │   │   │   ├─ Phone (tel, UK validation)
  │   │   │   ├─ Address (text, validation)
  │   │   │   ├─ CAPTCHA notice
  │   │   │   └─ Submit button
  │   │   │
  │   │   └─ Step 4: Success
  │   │       ├─ Confirmation message
  │   │       └─ Quote reference ID
  │   │
  │   └─ AdminDashboard (NEW)
  │       ├─ Login
  │       │   └─ Token input
  │       │
  │       ├─ Statistics
  │       │   ├─ Total count
  │       │   ├─ Status breakdown
  │       │   └─ Recent activity
  │       │
  │       ├─ Filters
  │       │   ├─ Status filter
  │       │   ├─ Search box
  │       │   └─ Items per page
  │       │
  │       ├─ Quotes Table
  │       │   ├─ Name column
  │       │   ├─ Email column
  │       │   ├─ Service column
  │       │   ├─ Status column (badge)
  │       │   ├─ Date column
  │       │   └─ Action button
  │       │
  │       ├─ Quote Details Modal
  │       │   ├─ Customer info display
  │       │   ├─ Property details display
  │       │   ├─ Status dropdown
  │       │   ├─ Notes textarea
  │       │   └─ Save button
  │       │
  │       └─ Export Button
  │           └─ Download CSV
```

---

## Validation Rules Visualization

```
EMAIL INPUT
    ├─ Format check: [email]@[domain].[tld]
    ├─ Regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    └─ Status: ✓ Valid or ✗ Invalid: "Please enter a valid email"

PHONE INPUT
    ├─ Format check: UK phone numbers
    ├─ Regex: /^(?:\+44|0)(?:\d\s?){9,10}$/
    ├─ Examples: 
    │   ✓ 01234 567890
    │   ✓ +44 1234 567890
    │   ✓ 07700 900123
    │   ✗ 12345 (invalid)
    └─ Error: "Please enter a valid UK phone number"

NAME INPUT
    ├─ Length check: 2-50 characters
    ├─ Format check: Letters, hyphens, apostrophes
    ├─ Regex: /^[a-zA-Z\s'-]+$/
    └─ Error: "Can only contain letters, spaces, hyphens, and apostrophes"

ADDRESS INPUT
    ├─ Length check: 5-200 characters
    └─ Error: "Please enter a valid address"

NUMBER INPUTS (Bedrooms/Bathrooms)
    ├─ Type: Integer
    ├─ Range: 1-20
    └─ Error: "Must be between 1 and 20"

REQUIRED FIELDS
    ├─ Property Type ──┐
    ├─ Bedrooms      ──├──► "This field is required"
    ├─ Bathrooms     ──┤
    ├─ Service Type  ──┤
    ├─ First Name    ──┤
    ├─ Last Name     ──┤
    ├─ Email         ──┤
    ├─ Phone         ──┤
    └─ Address       ──┘
```

---

This visual guide shows how all components work together to create a secure, user-friendly quote management system!
