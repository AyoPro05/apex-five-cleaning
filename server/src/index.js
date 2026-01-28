import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import authRouter from '../routes/authRoutes.js';
import emailVerificationRouter from './routes/emailVerification.js';
import quotesRouter from './routes/quotes.js';
import adminRouter from './routes/admin.js';
import bookingsRouter from './routes/bookings.js';
import paymentsRouter from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ limit: '10kb', extended: true }));
// Stripe webhook route (must be before general json parser for raw body)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // This will be handled by paymentsRouter
  paymentsRouter(req, res);
});

// General API rate limiter (applied after webhook)
// General API rate limiter
app.use('/api/', apiRateLimiter);

// Email service initializes automatically on import
// (SendGrid or SMTP based on EMAIL_PROVIDER environment variable)

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/apex-cleaning', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRouter);
app.use('/api/auth', emailVerificationRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'An error occurred'
      : err.message
  });
});

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
};

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
