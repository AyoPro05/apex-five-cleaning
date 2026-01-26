/**
 * APEX FIVE CLEANING - BACKEND SERVER
 * Phase 4: Member Portal, Booking System, Payment Integration
 * 
 * Start: 26 January 2026
 * Status: Initial setup
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// ============================================
// ROUTES (To be implemented)
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend server is running ✅' });
});

// Auth Routes (coming soon)
// app.use('/api/auth', require('./routes/authRoutes'));

// Booking Routes (coming soon)
// app.use('/api/bookings', require('./routes/bookingRoutes'));

// Payment Routes (coming soon)
// app.use('/api/payments', require('./routes/paymentRoutes'));

// User Routes (coming soon)
// app.use('/api/users', require('./routes/userRoutes'));

// Admin Routes (coming soon)
// app.use('/api/admin', require('./routes/adminRoutes'));

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Apex Five Cleaning - Backend Server`);
      console.log(`📍 Running on: http://localhost:${PORT}`);
      console.log(`🔐 Environment: ${process.env.NODE_ENV}`);
      console.log(`✅ Ready for Phase 4 implementation\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
