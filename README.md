# Apex Five Cleaning Website

A modern, fully-featured cleaning service website with booking, payment processing, and admin dashboard.

## Project Structure

```
apex-five-cleaning/
├── client/                 # React frontend with Vite
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components (Home, Services, ServiceArea, etc.)
│   │   ├── utils/          # Utilities (analytics, helpers)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/             # Static assets, robots.txt, sitemap.xml
│   └── package.json
├── server/                 # Node.js/Express backend
│   ├── src/
│   │   ├── models/         # Database models (User, Booking, Payment, Quote)
│   │   ├── routes/         # API routes (auth, admin, quotes, payments)
│   │   ├── middleware/     # Auth, rate limiting, captcha validation
│   │   └── utils/          # Email service, validation
│   ├── controllers/        # Business logic
│   ├── middleware/         # Express middleware
│   ├── server.js
│   └── package.json
└── public/                 # Shared static files

## Tech Stack

**Frontend**
- React 18
- Vite
- Tailwind CSS
- React Router

**Backend**
- Node.js / Express
- MongoDB
- Stripe (Payment processing)
- JWT Authentication
- Nodemailer (Email service)

## Features

- Service area pages (11 locations: Kent, Swale, London)
- Booking system with calendar
- Payment processing via Stripe
- Admin dashboard for bookings and quotes
- Email notifications
- User authentication
- Service area coverage maps
- Testimonials and blog
- FAQ system
- Contact forms with CAPTCHA
- Rate limiting and security

## Running the Project

### Frontend
```bash
cd client
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

### Backend
```bash
cd server
npm install
npm start
```
Backend runs on `http://localhost:5000`

## Database Setup

MongoDB must be running. Configure connection in `.env`:
```
MONGODB_URI=mongodb://localhost:27017/apex-cleaning
```

## Environment Variables

Create `.env` files in both `client/` and `server/` directories with required variables for:
- Database connection
- Stripe API keys
- Email service credentials
- JWT secret
- API endpoints

## Key Components

### Service Areas
- Canterbury, Dover, Maidstone, Tunbridge Wells, Sevenoaks, Ashford (Kent)
- Sheerness-on-Sea, Sittingbourne, Minster-on-Sea, Axminster (Swale)
- Croydon (London)

Each service area has:
- Dynamic page routing via slug
- Service coverage details
- Local information
- Contact information
- Geographic coordinates

### Payment System
- Stripe integration
- Secure payment processing
- Order history tracking
- Receipt generation

### Admin Dashboard
- Booking management
- Quote tracking
- User management
- System overview

## Changes Log

**January 28, 2026 - Frontend Server Configuration Fix**
- Fixed vite dev server to listen on port 5173 (was 3000)
- Updated API proxy configuration to point to backend on port 5001
- Both frontend and backend now communicating properly
- Servers restarted and tested successfully

**January 28, 2026 - Local Hero Images Implementation**
- All hero sections now use local images from `/images/heroes/`
- Home page: Uses Hero_Services.png
- ServiceArea pages: Uses service area images with Hero_Services.png fallback
- BlogPost pages: Uses blog post images
- Added image preloading and error handling for graceful fallbacks
- Removed dependency on external image URLs for hero sections
- Improved performance with local asset loading

**January 28, 2026 - Full-Width Hero Images**
- Home page: Hero section now displays full background image with parallax effect
- ServiceArea pages: Hero background uses service area images
- BlogPost pages: Hero image banner with gradient overlay for better text contrast
- Improved visual impact with full-width hero sections across all pages

**January 28, 2026 - Backend & Frontend Configuration Fix**
- Fixed backend syntax errors in `server/src/index.js` (malformed comment blocks)
- Moved dotenv.config() to top of index.js to ensure environment variables load before imports
- Updated `server/src/routes/payments.js` to handle missing Stripe keys gracefully
- Created `client/.env` with API URL configuration
- Changed backend port from 5000 to 5001 to avoid conflicts
- Frontend builds successfully (296KB gzipped)
- Backend connects to MongoDB and serves health endpoint

**Status**: ✅ Both frontend and backend are operational

---

**Last Updated:** January 28, 2026
