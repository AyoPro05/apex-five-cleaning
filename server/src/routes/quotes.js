import express from "express";
import multer from "multer";
import path from "path";
import Quote from "../models/Quote.js";
import {
  validateQuoteData,
  sanitizeEmail,
  sanitizePhoneNumber,
} from "../utils/validation.js";
import {
  sendClientConfirmationEmail,
  sendAdminNotificationEmail,
} from "../utils/emailService.js";
import {
  quoteRateLimiter,
  emailRateLimiter,
} from "../middleware/rateLimiter.js";
import { quoteImageUpload } from "../middleware/uploadMiddleware.js";
import { validateQuoteImageBuffer } from "../utils/imageValidation.js";
import { verifyCaptcha } from "../middleware/captchaMiddleware.js";
import { idempotency } from "../middleware/idempotency.js";
import { notifyNewQuote } from "../utils/leadWebhook.js";
import { emitEvent } from "../utils/eventBus.js";
import { assessSubmissionRisk } from "../utils/suspiciousActivity.js";
import { notifyAdminAlert } from "../utils/leadWebhook.js";

const router = express.Router();

// Normalize body for both JSON and multipart form data
const normalizeQuoteBody = (body) => {
  const normalized = { ...body };
  if (normalized.bedrooms !== undefined) {
    normalized.bedrooms = parseInt(normalized.bedrooms, 10);
  }
  if (normalized.bathrooms !== undefined) {
    normalized.bathrooms = parseInt(normalized.bathrooms, 10);
  }
  if (typeof normalized.additionalServices === "string") {
    try {
      normalized.additionalServices = JSON.parse(normalized.additionalServices) || [];
    } catch {
      normalized.additionalServices = [];
    }
  }
  if (!Array.isArray(normalized.additionalServices)) {
    normalized.additionalServices = [];
  }
  if (typeof normalized.attribution === "string") {
    try {
      normalized.attribution = JSON.parse(normalized.attribution) || undefined;
    } catch {
      normalized.attribution = undefined;
    }
  }
  return normalized;
};

const cleanAttribution = (attribution) => {
  if (!attribution || typeof attribution !== "object") return undefined;
  const cleaned = {};
  const fields = [
    "visitorId",
    "referralCode",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "utmTerm",
    "utmContent",
    "landingPage",
    "firstVisitAt",
    "visitCount",
    "serviceInterest",
    "serviceRegion",
    "leadSource",
  ];
  for (const key of fields) {
    const val = attribution[key];
    if (val !== undefined && val !== null && val !== "") {
      cleaned[key] = key === "referralCode" ? String(val).trim().toUpperCase() : val;
    }
  }
  return Object.keys(cleaned).length ? cleaned : undefined;
};

const submitQuoteHandler = async (req, res) => {
  try {
    const body = normalizeQuoteBody(req.body);
    const { isValid, errors, value } = validateQuoteData(body);

    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    value.email = sanitizeEmail(value.email);
    value.phone = sanitizePhoneNumber(value.phone);
    if (value.postcode) value.postcode = value.postcode.trim().toUpperCase();

    // Build images array from in-memory uploaded buffers (memoryStorage on Vercel)
    const images = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname || "") || ".jpg";
        const filename = `quote-${uniqueSuffix}${ext}`;
        const entry = {
          url: `/uploads/quotes/${filename}`,
          filename: file.originalname,
          mimeType: file.mimetype || "image/jpeg",
        };
        const buffer = file.buffer;
        if (buffer && buffer.length) {
          const imageCheck = validateQuoteImageBuffer(buffer);
          if (!imageCheck.ok) {
            return res.status(400).json({
              success: false,
              error: "Invalid image file. Please upload JPEG, PNG, GIF, WebP, or HEIC only.",
            });
          }
          entry.mimeType = imageCheck.mimeType;
          // Cap stored size for MongoDB (16MB doc limit)
          if (buffer.length <= 2.5 * 1024 * 1024) {
            entry.data = buffer.toString("base64");
          } else {
            console.warn(`Quote image ${filename} too large to store in DB; skipped`);
          }
        }
        images.push(entry);
      }
    }
    value.images = images;
    const attribution = cleanAttribution(value.attribution);
    if (attribution) value.attribution = attribution;
    else delete value.attribution;

    const ipAddress = req.ip || req.connection?.remoteAddress || "";
    const risk = await assessSubmissionRisk({
      type: "quote",
      captchaScore: req.captcha?.score,
      captchaVerified: req.captcha?.verified ?? true,
      ipAddress,
      email: value.email,
      phone: value.phone,
      postcode: value.postcode,
    });

    const quote = new Quote({
      ...value,
      captchaScore: req.captcha?.score || 1.0,
      captchaVerified: req.captcha?.verified ?? true,
      ipAddress,
      suspectedSpam: risk.suspectedSpam,
      suspicionReasons: risk.suspicionReasons,
    });

    let saved = false;
    for (let attempt = 0; attempt < 3 && !saved; attempt++) {
      try {
        await quote.save();
        saved = true;
      } catch (err) {
        if (err.code === 11000 && err.keyPattern?.reference && attempt < 2) {
          quote.reference = undefined;
          continue;
        }
        throw err;
      }
    }

    // Respond immediately after persist — SMTP can be slow; awaiting it here caused
    // client timeouts (axios 30s) and "quote not submitting" when mail providers stall.
    const payload = {
      success: true,
      message: "Quote request submitted successfully!",
      quoteId: quote._id,
      reference: quote.reference,
    };
    res.status(201).json(payload);

    setImmediate(() => {
      (async () => {
        try {
          await sendClientConfirmationEmail(
            quote.email,
            quote.firstName,
            quote.reference,
          );
          await sendAdminNotificationEmail(quote);
          await Quote.updateOne(
            { _id: quote._id },
            { confirmationEmailSent: true, adminEmailSent: true },
          );
        } catch (emailErr) {
          console.warn("Quote saved but outbound email failed:", emailErr?.message || emailErr);
        }
        try {
          await notifyNewQuote(quote);
        } catch {}
        emitEvent("quote.created", {
          quoteId: String(quote._id),
          reference: quote.reference,
          email: quote.email,
          phone: quote.phone,
          serviceType: quote.serviceType,
          postcode: quote.postcode,
          propertyType: quote.propertyType,
          bedrooms: quote.bedrooms,
          bathrooms: quote.bathrooms,
          status: quote.status,
          suspectedSpam: quote.suspectedSpam,
          suspicionReasons: quote.suspicionReasons,
        });
        if (quote.suspectedSpam) {
          notifyAdminAlert(
            `Suspected spam quote ${quote.reference || quote._id}`,
            [
              `Customer: ${quote.firstName} ${quote.lastName}`,
              `Email: ${quote.email}`,
              `Reasons: ${quote.suspicionReasons.join(", ")}`,
              `CAPTCHA: ${Math.round((quote.captchaScore || 0) * 100)}%`,
            ].join("\n"),
          ).catch(() => {});
        }
      })();
    });
    return;
  } catch (error) {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, error: "Each image must be under 5MB" });
      }
      if (error.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ success: false, error: "Maximum 5 images allowed" });
      }
    }
    if (error.message?.includes("Only image files")) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error("Error submitting quote:", error);
    return res.status(500).json({ success: false, error: "Server error." });
  }
};

router.post(
  "/submit",
  quoteRateLimiter,
  emailRateLimiter,
  idempotency(),
  quoteImageUpload.array("images", 5),
  verifyCaptcha,
  submitQuoteHandler,
);

// Backward-compatible endpoint for older frontend bundles still posting to /api/quotes
router.post(
  "/",
  quoteRateLimiter,
  emailRateLimiter,
  idempotency(),
  quoteImageUpload.array("images", 5),
  verifyCaptcha,
  submitQuoteHandler,
);

// ... rest of your code (GET route)
export default router;
