/**
 * Suspicious activity assessment for inbound leads and quotes.
 * Flags submissions for admin review without blocking borderline CAPTCHA scores.
 */

import Quote from "../models/Quote.js";
import ChatLead from "../models/ChatLead.js";

const DISPOSABLE_EMAIL_RE =
  /@(mailinator|tempmail|guerrillamail|10minutemail|yopmail|throwaway|sharklasers|trashmail)\./i;

export const SUSPICION_REASON_LABELS = {
  low_captcha_score: "Low CAPTCHA score",
  captcha_unverified: "CAPTCHA not verified",
  missing_postcode: "Missing postcode",
  ip_burst: "Multiple submissions from same IP",
  email_burst: "Multiple quotes from same email (24h)",
  disposable_email: "Disposable email domain",
  missing_contact: "Missing email and phone",
  phone_only_chat: "Chat lead with phone only (no email)",
};

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export function getCaptchaBlockThreshold() {
  return envNumber("RECAPTCHA_BLOCK_THRESHOLD", 0.3);
}

export function getCaptchaFlagThreshold() {
  return envNumber("RECAPTCHA_SCORE_THRESHOLD", 0.5);
}

/**
 * @param {object} input
 * @param {'quote'|'chat_lead'} input.type
 * @param {number} [input.captchaScore]
 * @param {boolean} [input.captchaVerified]
 * @param {string} [input.ipAddress]
 * @param {string} [input.email]
 * @param {string} [input.phone]
 * @param {string} [input.postcode]
 */
export async function assessSubmissionRisk(input = {}) {
  const reasons = [];
  const flagThreshold = getCaptchaFlagThreshold();
  const ipBurstCount = envNumber("SUSPICION_IP_BURST_COUNT", 3);
  const ipBurstWindowMs = envNumber("SUSPICION_IP_BURST_WINDOW_MS", 60 * 60 * 1000);
  const emailBurstCount = envNumber("SUSPICION_EMAIL_BURST_COUNT", 3);

  const captchaScore = input.captchaScore;
  if (captchaScore != null && captchaScore < flagThreshold) {
    reasons.push("low_captcha_score");
  }
  if (input.captchaVerified === false && process.env.NODE_ENV === "production") {
    reasons.push("captcha_unverified");
  }

  const postcode = String(input.postcode || "").trim();
  if (!postcode) {
    reasons.push("missing_postcode");
  }

  const email = String(input.email || "").trim().toLowerCase();
  const phone = String(input.phone || "").trim();

  if (email && DISPOSABLE_EMAIL_RE.test(email)) {
    reasons.push("disposable_email");
  }

  if (input.type === "chat_lead") {
    if (!email && !phone) {
      reasons.push("missing_contact");
    } else if (phone && !email) {
      reasons.push("phone_only_chat");
    }
  }

  const ipAddress = String(input.ipAddress || "").trim();
  if (ipAddress) {
    const since = new Date(Date.now() - ipBurstWindowMs);
    const [quoteCount, leadCount] = await Promise.all([
      Quote.countDocuments({
        ipAddress,
        createdAt: { $gte: since },
        isDeleted: { $ne: true },
      }),
      ChatLead.countDocuments({
        ipAddress,
        createdAt: { $gte: since },
      }),
    ]);
    if (quoteCount + leadCount + 1 >= ipBurstCount) {
      reasons.push("ip_burst");
    }
  }

  if (email && input.type === "quote") {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const emailCount = await Quote.countDocuments({
      email,
      createdAt: { $gte: dayAgo },
      isDeleted: { $ne: true },
    });
    if (emailCount + 1 >= emailBurstCount) {
      reasons.push("email_burst");
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  return {
    suspectedSpam: uniqueReasons.length > 0,
    suspicionReasons: uniqueReasons,
  };
}

export function formatSuspicionReasons(reasons = []) {
  return reasons.map((key) => SUSPICION_REASON_LABELS[key] || key);
}
