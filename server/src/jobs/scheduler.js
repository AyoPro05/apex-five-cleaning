/**
 * BACKGROUND SCHEDULER
 * Runs hourly maintenance tasks + a once-per-day ops digest.
 * Single-process (no external cron needed). Safe to leave running.
 *
 * Hourly tasks:
 *   - Purge soft-deleted quotes past the 30-day retention window
 *   - Detect quotes stuck in "new" status > 24h and email a single reminder
 *
 * Daily task (09:00 UTC):
 *   - Send ops digest to NOTIFY_EMAIL with key metrics
 *
 * Disable by setting SCHEDULER_ENABLED=false
 */

import mongoose from "mongoose";
import Quote from "../models/Quote.js";
import ChatLead from "../models/ChatLead.js";
import QuotePayment from "../../models/QuotePayment.js";
import Booking from "../../models/Booking.js";
import {
  sendStuckQuoteReminderEmail,
  sendDailyDigestEmail,
  sendClientFollowUpEmail,
  sendPaymentReminderEmail,
  sendSatisfactionFollowUpEmail,
} from "../utils/emailService.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const QUOTE_RETENTION_DAYS = 30;
const STUCK_THRESHOLD_HOURS = 24;
const CLIENT_FOLLOWUP_HOURS = 24;
const PAYMENT_REMINDER_HOURS = 48;
const SATISFACTION_THRESHOLD_HOURS = 48;
const DIGEST_HOUR_UTC = Number(process.env.DAILY_DIGEST_HOUR_UTC ?? 9);
const FOLLOWUP_BATCH_LIMIT = 50;

let hourlyTimer = null;
let started = false;
let lastDigestDateKey = null;

const isDbReady = () => mongoose.connection.readyState === 1;

async function purgeExpiredDeletedQuotes() {
  if (!isDbReady()) return;
  const cutoff = new Date(Date.now() - QUOTE_RETENTION_DAYS * DAY_MS);
  const result = await Quote.deleteMany({ isDeleted: true, deletedAt: { $lte: cutoff } });
  if (result?.deletedCount) {
    console.log(`✓ Scheduler: purged ${result.deletedCount} soft-deleted quotes`);
  }
}

async function checkStuckQuotes() {
  if (!isDbReady()) return;
  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_HOURS * HOUR_MS);
  const stuck = await Quote.find({
    status: "new",
    isDeleted: { $ne: true },
    createdAt: { $lte: cutoff },
    stuckReminderSentAt: { $exists: false },
  })
    .limit(50)
    .lean();

  if (!stuck.length) return;

  const result = await sendStuckQuoteReminderEmail(stuck);
  if (result?.success) {
    const ids = stuck.map((q) => q._id);
    await Quote.updateMany({ _id: { $in: ids } }, { $set: { stuckReminderSentAt: new Date() } });
    console.log(`✓ Scheduler: stuck-quote reminder sent for ${ids.length} quote(s)`);
  } else {
    console.warn("⚠️ Scheduler: stuck-quote reminder failed:", result?.error || "unknown");
  }
}

function shouldRunDigestNow() {
  const now = new Date();
  const hour = now.getUTCHours();
  if (hour !== DIGEST_HOUR_UTC) return false;
  const todayKey = now.toISOString().slice(0, 10);
  if (lastDigestDateKey === todayKey) return false;
  return true;
}

async function gatherDigestStats() {
  if (!isDbReady()) return null;
  const dayAgo = new Date(Date.now() - DAY_MS);
  const stuckCutoff = new Date(Date.now() - STUCK_THRESHOLD_HOURS * HOUR_MS);

  const [newQuotes24h, newChatLeads24h, pendingAgg, stuckQuotes] = await Promise.all([
    Quote.countDocuments({ createdAt: { $gte: dayAgo }, isDeleted: { $ne: true } }),
    ChatLead.countDocuments({ createdAt: { $gte: dayAgo } }),
    QuotePayment.aggregate([
      { $match: { status: "pending" } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$amount" } } },
    ]),
    Quote.countDocuments({
      status: "new",
      isDeleted: { $ne: true },
      createdAt: { $lte: stuckCutoff },
    }),
  ]);

  const pending = pendingAgg?.[0] || { count: 0, total: 0 };

  return {
    newQuotes24h,
    newChatLeads24h,
    pendingPaymentsCount: pending.count || 0,
    pendingPaymentsTotal: Number(pending.total || 0),
    stuckQuotes,
  };
}

async function runDailyDigest() {
  if (!shouldRunDigestNow()) return;
  if (!isDbReady()) return;
  const todayKey = new Date().toISOString().slice(0, 10);
  try {
    const stats = await gatherDigestStats();
    if (!stats) return;
    const result = await sendDailyDigestEmail(stats);
    if (result?.success) {
      lastDigestDateKey = todayKey;
      console.log(`✓ Scheduler: daily digest sent for ${todayKey}`);
    } else {
      console.warn("⚠️ Scheduler: daily digest send failed:", result?.error || "unknown");
    }
  } catch (err) {
    console.warn("Scheduler: digest task error:", err.message);
  }
}

/**
 * Send a friendly client follow-up 24h after submission if quote is still "new".
 * One-shot per quote (tracked via clientFollowUpSentAt).
 */
async function sendClientFollowUps() {
  if (!isDbReady()) return;
  const cutoff = new Date(Date.now() - CLIENT_FOLLOWUP_HOURS * HOUR_MS);
  const candidates = await Quote.find({
    status: "new",
    isDeleted: { $ne: true },
    createdAt: { $lte: cutoff },
    clientFollowUpSentAt: { $exists: false },
  })
    .select("_id reference firstName email createdAt")
    .limit(FOLLOWUP_BATCH_LIMIT)
    .lean();

  if (!candidates.length) return;

  let sent = 0;
  for (const quote of candidates) {
    if (!quote.email) continue;
    const result = await sendClientFollowUpEmail(
      quote.email,
      quote.firstName || "there",
      quote.reference || String(quote._id),
    );
    if (result?.success) {
      await Quote.updateOne(
        { _id: quote._id },
        { $set: { clientFollowUpSentAt: new Date() } },
      );
      sent += 1;
    }
  }
  if (sent) console.log(`✓ Scheduler: sent ${sent} client follow-up email(s)`);
}

/**
 * Send a payment reminder 48h after a quote is converted (approved) if no
 * successful QuotePayment exists yet. One-shot per conversion cycle.
 */
async function sendPaymentReminders() {
  if (!isDbReady()) return;
  const cutoff = new Date(Date.now() - PAYMENT_REMINDER_HOURS * HOUR_MS);
  const candidates = await Quote.find({
    status: "converted",
    isDeleted: { $ne: true },
    convertedAt: { $lte: cutoff },
    paymentReminderSentAt: { $exists: false },
  })
    .select("_id reference firstName email approvedAmount convertedAt")
    .limit(FOLLOWUP_BATCH_LIMIT)
    .lean();

  if (!candidates.length) return;

  let sent = 0;
  for (const quote of candidates) {
    if (!quote.email) continue;
    // Skip if a payment has already succeeded for this quote
    const paid = await QuotePayment.exists({ quoteId: quote._id, status: "succeeded" });
    if (paid) {
      // Stamp anyway so we don't keep checking
      await Quote.updateOne(
        { _id: quote._id },
        { $set: { paymentReminderSentAt: new Date() } },
      );
      continue;
    }
    const result = await sendPaymentReminderEmail(
      quote.email,
      quote.firstName || "there",
      quote.reference || String(quote._id),
      quote.approvedAmount,
    );
    if (result?.success) {
      await Quote.updateOne(
        { _id: quote._id },
        { $set: { paymentReminderSentAt: new Date() } },
      );
      sent += 1;
    }
  }
  if (sent) console.log(`✓ Scheduler: sent ${sent} payment reminder(s)`);
}

/**
 * Send a satisfaction follow-up 48h after a booking is marked "completed".
 * One-shot per booking (satisfactionEmailSentAt). Falls back to the linked
 * User's email when no customer snapshot is on the booking.
 */
async function sendSatisfactionFollowUps() {
  if (!isDbReady()) return;
  const cutoff = new Date(Date.now() - SATISFACTION_THRESHOLD_HOURS * HOUR_MS);
  const candidates = await Booking.find({
    status: "completed",
    completedAt: { $lte: cutoff },
    satisfactionEmailSentAt: { $exists: false },
  })
    .populate("userId", "email firstName")
    .limit(FOLLOWUP_BATCH_LIMIT)
    .lean();

  if (!candidates.length) return;

  let sent = 0;
  for (const booking of candidates) {
    const email = booking.customerEmail || booking.userId?.email;
    const firstName = booking.customerFirstName || booking.userId?.firstName || "there";
    if (!email) continue;
    const reference = booking.quoteReference || String(booking._id);
    const result = await sendSatisfactionFollowUpEmail(email, firstName, reference);
    if (result?.success) {
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { satisfactionEmailSentAt: new Date() } },
      );
      sent += 1;
    }
  }
  if (sent) console.log(`✓ Scheduler: sent ${sent} satisfaction follow-up(s)`);
}

async function runHourly() {
  try {
    await purgeExpiredDeletedQuotes();
  } catch (err) {
    console.warn("Scheduler: purge failed:", err.message);
  }
  try {
    await checkStuckQuotes();
  } catch (err) {
    console.warn("Scheduler: stuck-quote check failed:", err.message);
  }
  try {
    await sendClientFollowUps();
  } catch (err) {
    console.warn("Scheduler: client follow-up task failed:", err.message);
  }
  try {
    await sendPaymentReminders();
  } catch (err) {
    console.warn("Scheduler: payment reminder task failed:", err.message);
  }
  try {
    await sendSatisfactionFollowUps();
  } catch (err) {
    console.warn("Scheduler: satisfaction follow-up task failed:", err.message);
  }
  try {
    await runDailyDigest();
  } catch (err) {
    console.warn("Scheduler: digest failed:", err.message);
  }
}

/**
 * Start the background scheduler. Safe to call multiple times (idempotent).
 */
export function startScheduler() {
  if (started) return;
  if (process.env.SCHEDULER_ENABLED === "false") {
    console.log("ℹ Scheduler disabled via SCHEDULER_ENABLED=false");
    return;
  }
  started = true;
  console.log(
    `✓ Background scheduler started (hourly tasks + daily digest @${DIGEST_HOUR_UTC}:00 UTC)`,
  );
  // First run shortly after startup so DB has time to settle
  setTimeout(() => {
    runHourly().catch(() => {});
  }, 30 * 1000);
  hourlyTimer = setInterval(runHourly, HOUR_MS);
}

/**
 * Stop the scheduler (used in tests or graceful shutdown).
 */
export function stopScheduler() {
  if (hourlyTimer) {
    clearInterval(hourlyTimer);
    hourlyTimer = null;
  }
  started = false;
}
