import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "..", ".env");
const result = dotenv.config({ path: envPath });
if (result.error) {
  // Expected on Render/Heroku – env vars come from the platform
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠ No .env file found at", envPath, "- using environment variables");
  }
} else {
  console.log("✓ Loaded .env from:", envPath);
}

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is required in production. Set it in your environment (e.g. Render dashboard).");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !process.env.MONGODB_URI) {
  console.error(
    "FATAL: MONGODB_URI is required in production. Create a MongoDB Atlas cluster (or other hosted MongoDB) and set MONGODB_URI in Render → Environment.",
  );
  process.exit(1);
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import authRouter from "./routes/authRoutes.js";
import emailVerificationRouter from "./routes/emailVerification.js";
import quotesRouter from "./routes/quotes.js";
import adminRouter from "./routes/admin.js";
import bookingsRouter from "./routes/bookings.js";
import paymentsRouter from "./routes/payments.js";
import customerRouter from "./routes/customer.js";
import uploadsRouter from "./routes/uploads.js";
import contactRouter from "./routes/contact.js";
import { getEmailConfigStatus, verifyEmailTransport } from "./utils/emailService.js";

// Fail fast instead of waiting for Mongoose operation buffering timeouts
mongoose.set("bufferCommands", false);

const app = express();
// Render (and similar) terminate TLS and set X-Forwarded-*. Required for correct req.ip and express-rate-limit.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
// Force port to 5001 if not specified to match your logs
const PORT = process.env.PORT || 5001;
const NODE_ENV = process.env.NODE_ENV || "development";

// Security headers baseline (HSTS added by reverse proxy/HTTPS in production)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

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
// Render injects this URL for the current web service (no need to hardcode *.onrender.com per deploy)
if (process.env.RENDER_EXTERNAL_URL) {
  const url = process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
  if (!corsOrigins.includes(url)) corsOrigins.push(url);
}
// Optional: comma-separated origins (e.g. preview URLs)
if (process.env.ADDITIONAL_CORS_ORIGINS) {
  process.env.ADDITIONAL_CORS_ORIGINS.split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .forEach((origin) => {
      if (!corsOrigins.includes(origin)) corsOrigins.push(origin);
    });
}
// Production: allow custom domain + known Render static hostnames
if (process.env.NODE_ENV === "production") {
  [
    "https://www.apexfivecleaning.co.uk",
    "https://apexfivecleaning.co.uk",
    "https://apex-five-cleaning-api.onrender.com",
    "https://apex-five-cleaning-1.onrender.com",
    "https://apex-five-cleaning-2.onrender.com",
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

// Root – health / welcome (so "GET /" doesn't 404)
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Apex Five Cleaning API",
    docs: "Use /api/quotes, /api/payments, /api/admin, etc.",
  });
});

let dbConnected = false;

const isMongoReady = () => mongoose.connection.readyState === 1 && dbConnected;

// Health check for ops/monitoring (no secrets). Email status shows if verification/quote emails can be sent.
// Returns 503 if MongoDB is not connected so load balancers can mark instance unhealthy.
app.get("/health", (req, res) => {
  const email = getEmailConfigStatus();
  const payload = {
    ok: isMongoReady(),
    timestamp: new Date().toISOString(),
    database: {
      connected: isMongoReady(),
      readyState: mongoose.connection.readyState,
    },
    email: {
      configured: email.configured,
      provider: email.provider,
      ...(email.hint && { hint: email.hint }),
    },
  };
  if (!isMongoReady()) {
    return res.status(503).json({ ...payload, error: "Database not connected" });
  }
  res.json(payload);
});

// Guard all API requests from hanging when MongoDB temporarily disconnects
app.use("/api", (req, res, next) => {
  if (!isMongoReady()) {
    return res.status(503).json({
      error: "Service unavailable",
      message: "Database temporarily unavailable. Please retry in a few seconds.",
    });
  }
  next();
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/auth", emailVerificationRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/quotes", quotesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/customer", customerRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/contact", contactRouter);

// Database connection
const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    (process.env.NODE_ENV === "production"
      ? null
      : "mongodb://localhost:27017/apex-cleaning");
  if (!uri) {
    dbConnected = false;
    console.error("✗ MongoDB URI missing (MONGODB_URI).");
    return;
  }
  try {
    await mongoose.connect(uri);
    dbConnected = true;
    console.log("✓ Connected to MongoDB");
    verifyEmailTransport().catch(() => {});
    mongoose.connection.on("connected", () => {
      dbConnected = true;
      console.log("✓ MongoDB connected");
    });
    mongoose.connection.on("reconnected", () => {
      dbConnected = true;
      console.log("✓ MongoDB reconnected");
    });
    mongoose.connection.on("disconnected", () => {
      dbConnected = false;
      console.error("✗ MongoDB disconnected");
    });
    mongoose.connection.on("error", (err) => {
      dbConnected = false;
      console.error("✗ MongoDB runtime error:", err.message);
    });
  } catch (error) {
    dbConnected = false;
    console.error("✗ MongoDB connection failed:", error.message);
    if (process.env.NODE_ENV === "production") {
      console.error(
        "FATAL: Cannot run API without MongoDB in production. Fix MONGODB_URI (Atlas IP allowlist: 0.0.0.0/0 for Render) and redeploy.",
      );
      process.exit(1);
    }
  }
};

const startServer = async () => {
  await connectDB();
  if (NODE_ENV === "production") {
    const cu = process.env.CLIENT_URL || "";
    if (!cu || /localhost|127\.0\.0\.1/.test(cu)) {
      console.warn(
        "⚠ CLIENT_URL is unset or points to localhost. Set CLIENT_URL to your live frontend (e.g. https://www.apexfivecleaning.co.uk). Verification and reset links in emails use this URL.",
      );
    }
  }
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
