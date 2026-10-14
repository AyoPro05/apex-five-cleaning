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
  quoteRateLimiter,
  emailRateLimiter,
} from "../middleware/rateLimiter.js";
import { quoteImageUpload } from "../middleware/uploadMiddleware.js";
import { validateQuoteImageBuffer } from "../utils/imageValidation.js";
import { verifyCaptcha } from "../middleware/captchaMiddleware.js";
import { assessSubmissionRisk } from "../utils/suspiciousActivity.js";
import defaultQueue from "../services/automationQueue.js";
import { drainAutomationJobs } from "../services/automationCycle.js";
import { queueBackgroundWork } from "../services/backgroundWork.js";
import { defaultIdempotencyService, fingerprintRequest } from "../services/idempotencyService.js";

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

const RETRY_MESSAGE = "Your request is still being recorded. Please retry shortly with the same request details and idempotency key.";

export function createSubmitQuoteHandler({
  QuoteModel = Quote,
  idempotencyService = defaultIdempotencyService,
  queue = defaultQueue,
  assessSubmissionRisk: assessRisk = assessSubmissionRisk,
  queueBackgroundWork: scheduleBackground = queueBackgroundWork,
  drainAutomationJobs: drain = drainAutomationJobs,
  logger = console,
} = {}) {
 return async (req, res) => {
  let acquisition;
  let persisted = false;
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
    const risk = await assessRisk({
      type: "quote",
      captchaScore: req.captcha?.score,
      captchaVerified: req.captcha?.verified ?? true,
      ipAddress,
      email: value.email,
      phone: value.phone,
      postcode: value.postcode,
    });

    // CAPTCHA tokens and generated storage paths change on retry; the fingerprint
    // represents the normalized customer details and actual uploaded image bytes.
    const { captchaToken, images: storedImages, ...fingerprintBody } = value;
    acquisition = await idempotencyService.acquire({
      scope: "POST:/api/quotes/submit",
      key: req.get("X-Idempotency-Key"),
      fingerprint: fingerprintRequest(fingerprintBody, req.files),
    });
    if (acquisition.kind === "replay") {
      res.setHeader("X-Idempotent-Replay", "true");
      return res.status(acquisition.status).json(acquisition.body);
    }
    if (acquisition.kind === "conflict") {
      return res.status(409).json({ success: false, error: "This request key was already used for different details. Please submit the changed request with a new key." });
    }
    if (acquisition.kind === "in-progress") {
      return res.status(409).json({ success: false, error: RETRY_MESSAGE });
    }
    const owner = acquisition.kind === "acquired"
      ? { recordId: acquisition.record._id, ownerToken: acquisition.ownerToken }
      : null;
    let quote = owner ? await QuoteModel.findOne({ idempotencyRecordId: owner.recordId }) : null;
    persisted = Boolean(quote);
    if (!quote) {
      quote = new QuoteModel({
        ...value,
        ...(owner ? { idempotencyRecordId: owner.recordId } : {}),
        captchaScore: req.captcha?.score || 1.0,
        captchaVerified: req.captcha?.verified ?? true,
        ipAddress,
        suspectedSpam: risk.suspectedSpam,
        suspicionReasons: risk.suspicionReasons,
      });
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await quote.save();
          persisted = true;
          break;
        } catch (error) {
          if (error.code === 11000 && owner && error.keyPattern?.idempotencyRecordId) {
            const winner = await QuoteModel.findOne({ idempotencyRecordId: owner.recordId });
            if (winner) { quote = winner; persisted = true; break; }
          }
          if (error.code === 11000 && error.keyPattern?.reference && attempt < 2) {
            quote.reference = undefined;
            continue;
          }
          throw error;
        }
      }
    }

    const quoteId = String(quote._id);
    const jobs = [
      { type: "quote.client-confirmation", dedupeKey: `quote.client-confirmation:${quoteId}` },
      { type: "quote.admin-notification", dedupeKey: `quote.admin-notification:${quoteId}` },
      { type: "quote.lead-webhook", dedupeKey: `quote.lead-webhook:${quoteId}` },
      { type: "domain.event", dedupeKey: `domain.event:quote.created:${quoteId}`, payload: { event: "quote.created", data: { quoteId, reference: quote.reference } } },
      ...(quote.suspectedSpam ? [{ type: "quote.spam-alert", dedupeKey: `quote.spam-alert:${quoteId}` }] : []),
    ];
    const outcomes = await Promise.allSettled(jobs.map((job) => queue.enqueue({
      ...job, entityType: "Quote", entityId: quoteId,
    })));
    const failure = outcomes.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;

    const payload = {
      success: true,
      message: "Quote request submitted successfully!",
      quoteId,
      reference: quote.reference,
    };
    if (owner) {
      const attached = await idempotencyService.attachResource({ ...owner, resourceType: "Quote", resourceId: quoteId });
      if (!attached) return res.status(409).json({ success: false, error: RETRY_MESSAGE });
      const completed = await idempotencyService.complete({ ...owner, status: 201, body: payload });
      if (!completed) return res.status(409).json({ success: false, error: RETRY_MESSAGE });
    }
    res.status(201).json(payload);
    scheduleBackground(() => drain({ limit: 8 }), {
      onError: (error) => logger.error("Quote automation drain failed:", error),
    });
    return;
  } catch (error) {
    if (!persisted && acquisition?.kind === "acquired") {
      try {
        await idempotencyService.release({ recordId: acquisition.record._id, ownerToken: acquisition.ownerToken });
      } catch (releaseError) {
        logger.error("Quote idempotency release failed:", releaseError);
      }
    }
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
    logger.error("Error submitting quote:", error);
    return res.status(500).json({ success: false, error: "Server error." });
  }
 };
}

const submitQuoteHandler = createSubmitQuoteHandler();

router.post(
  "/submit",
  quoteRateLimiter,
  emailRateLimiter,
  quoteImageUpload.array("images", 5),
  verifyCaptcha,
  submitQuoteHandler,
);

// Backward-compatible endpoint for older frontend bundles still posting to /api/quotes
router.post(
  "/",
  quoteRateLimiter,
  emailRateLimiter,
  quoteImageUpload.array("images", 5),
  verifyCaptcha,
  submitQuoteHandler,
);

// ... rest of your code (GET route)
export default router;
