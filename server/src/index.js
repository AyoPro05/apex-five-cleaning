import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import authRouter from "../routes/authRoutes.js";
import emailVerificationRouter from "./routes/emailVerification.js";
import quotesRouter from "./routes/quotes.js";
import adminRouter from "./routes/admin.js";
import bookingsRouter from "./routes/bookings.js";
import paymentsRouter from "./routes/payments.js";
import customerRouter from "./routes/customer.js";

const app = express();
// Force port to 5001 if not specified to match your logs
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || "development";

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Middleware - Updated origin to match your Vite port 5173
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));

// Serve uploaded quote images
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/auth", emailVerificationRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/customer", customerRouter);

// Database connection
const connectDB = async () => {
  try {
    // Uses 5001/apex-cleaning as seen in your logs
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/apex-cleaning",
    );
    console.log("✓ Connected to MongoDB");
  } catch (error) {
    console.error("✗ MongoDB connection failed:", error.message);
  }
};

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ Environment: ${NODE_ENV}`);
    console.log(`✓ Client URL: http://localhost:5173\n`);
  });
};

startServer();

export default app;
