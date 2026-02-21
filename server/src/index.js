import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

// Security headers (HSTS added by reverse proxy/HTTPS in production)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// CORS: localhost for dev, CLIENT_URL for production
const corsOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];
if (process.env.CLIENT_URL) {
  const url = process.env.CLIENT_URL.replace(/\/$/, "");
  if (!corsOrigins.includes(url)) corsOrigins.push(url);
}
// Production: allow custom domain + Render static site URL (so API works before DNS is verified)
if (process.env.NODE_ENV === "production") {
  [
    "https://www.apexfivecleaning.co.uk",
    "https://apexfivecleaning.co.uk",
    "https://apex-five-cleaning-2.onrender.com", // frontend static site
  ].forEach((origin) => {
    if (!corsOrigins.includes(origin)) corsOrigins.push(origin);
  });
}
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));

// API rate limiting – apply before routes to intercept all incoming requests
app.use(apiRateLimiter);

// Root – health / welcome (so "GET /" doesn’t 404)
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Apex Five Cleaning API",
    docs: "Use /api/quotes, /api/payments, /api/admin, etc.",
  });
});

// Serve uploaded quote images (absolute path so it works regardless of cwd)
const uploadsPath = path.resolve(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsPath));
if (NODE_ENV === "development") {
  console.log(`✓ Uploads served from: ${uploadsPath}`);
}

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
    console.log(
      `✓ Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}\n`,
    );
  });
};

startServer();

export default app;
