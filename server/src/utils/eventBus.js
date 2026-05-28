/**
 * OUTBOUND EVENT BUS
 * Dispatches signed JSON events to one or more webhook URLs (CRM, Zapier, n8n, etc.).
 *
 * Configure:
 *   EVENT_WEBHOOK_URLS  — comma-separated HTTPS endpoints
 *   EVENT_WEBHOOK_SECRET — HMAC signing secret (receivers verify X-Apex-Signature)
 *
 * Leave EVENT_WEBHOOK_URLS unset to disable cleanly.
 */

import crypto from "crypto";
import axios from "axios";

const TIMEOUT_MS = 6000;
const SIGNATURE_HEADER = "X-Apex-Signature";
const EVENT_HEADER = "X-Apex-Event";

/** @typedef {'quote.created'|'quote.converted'|'chat_lead.created'|'booking.draft_created'|'booking.confirmed'|'booking.completed'|'payment.succeeded'} EventType */

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "captchaToken",
  "data",
  "images",
  "verificationToken",
  "resetToken",
  "stripePaymentIntentId",
]);

function getWebhookUrls() {
  const raw = process.env.EVENT_WEBHOOK_URLS || "";
  return raw
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.startsWith("http"));
}

function getSigningSecret() {
  const secret = process.env.EVENT_WEBHOOK_SECRET || process.env.ADMIN_TOKEN || "";
  return secret.trim();
}

function redactValue(value, depth = 0) {
  if (value == null) return value;
  if (depth > 4) return "[truncated]";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key)) continue;
      out[key] = redactValue(val, depth + 1);
    }
    return out;
  }
  if (typeof value === "string" && value.length > 2000) {
    return `${value.slice(0, 2000)}…`;
  }
  return value;
}

function buildSignature(timestamp, body) {
  const secret = getSigningSecret();
  if (!secret) return "";
  const payload = `${timestamp}.${body}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function postToUrl(url, envelope) {
  const body = JSON.stringify(envelope);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = buildSignature(timestamp, body);
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "ApexFiveCleaning-EventBus/1.0",
    [EVENT_HEADER]: envelope.event,
  };
  if (signature) {
    headers[SIGNATURE_HEADER] = `t=${timestamp},v1=${signature}`;
  }
  await axios.post(url, body, { timeout: TIMEOUT_MS, headers });
}

/**
 * Emit a domain event to all configured webhook URLs (non-blocking).
 * @param {EventType} event
 * @param {Record<string, unknown>} data
 */
export function emitEvent(event, data = {}) {
  const urls = getWebhookUrls();
  if (!urls.length) return { skipped: true };

  const envelope = {
    event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source: "apex-five-cleaning-api",
    data: redactValue(data),
  };

  setImmediate(() => {
    Promise.allSettled(
      urls.map(async (url) => {
        try {
          await postToUrl(url, envelope);
          console.log(`✓ Event dispatched: ${event} -> ${new URL(url).host}`);
        } catch (error) {
          console.warn(`⚠️ Event dispatch failed (${event} -> ${url}):`, error.message);
        }
      }),
    ).catch(() => {});
  });

  return { queued: true, targets: urls.length };
}

export function isEventBusConfigured() {
  return getWebhookUrls().length > 0;
}

export function verifyEventSignature(rawBody, signatureHeader, maxSkewSec = 300) {
  const secret = getSigningSecret();
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(",")
      .map((part) => part.trim().split("="))
      .filter(([key, val]) => key && val),
  );

  const timestamp = parts.t;
  const provided = parts.v1;
  if (!timestamp || !provided) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > maxSkewSec) return false;

  const expected = buildSignature(timestamp, rawBody);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}
