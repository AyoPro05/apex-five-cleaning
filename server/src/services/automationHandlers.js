import Booking from "../../models/Booking.js";
import QuotePayment from "../../models/QuotePayment.js";
import ChatLead from "../models/ChatLead.js";
import Quote from "../models/Quote.js";
import {
  sendAdminNotificationEmail,
  sendClientConfirmationEmail,
  sendClientFollowUpEmail,
  sendDailyDigestEmail,
  sendPaymentReminderEmail,
  sendQuoteApprovedEmail,
  sendSatisfactionFollowUpEmail,
  sendStuckQuoteReminderEmail,
} from "../utils/emailService.js";
import { dispatchEvent } from "../utils/eventBus.js";
import {
  notifyAdminAlert,
  notifyHotChatLead,
  notifyNewQuote,
} from "../utils/leadWebhook.js";

const HOUR_MS = 60 * 60 * 1000;
const NO_OP = Object.freeze({ skipped: true });

const defaultDependencies = {
  QuoteModel: Quote,
  ChatLeadModel: ChatLead,
  BookingModel: Booking,
  QuotePaymentModel: QuotePayment,
  sendClientConfirmationEmail,
  sendAdminNotificationEmail,
  sendQuoteApprovedEmail,
  sendStuckQuoteReminderEmail,
  sendClientFollowUpEmail,
  sendPaymentReminderEmail,
  sendSatisfactionFollowUpEmail,
  sendDailyDigestEmail,
  notifyNewQuote,
  notifyHotChatLead,
  notifyAdminAlert,
  dispatchEvent,
  now: () => new Date(),
};

function mergeDependencies(overrides) {
  const dependencies = { ...defaultDependencies };
  for (const [name, value] of Object.entries(overrides || {})) {
    if (value !== undefined) dependencies[name] = value;
  }
  return dependencies;
}

function asDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function currentDate(now) {
  const value = typeof now === "function" ? now() : now;
  return asDate(value) || new Date();
}

function isDue(value, hours, now) {
  const date = asDate(value);
  return Boolean(date && date.getTime() <= now.getTime() - hours * HOUR_MS);
}

function sameInstant(left, right) {
  const leftDate = asDate(left);
  const rightDate = asDate(right);
  return Boolean(leftDate && rightDate && leftDate.getTime() === rightDate.getTime());
}

async function resolveQuery(query, populate) {
  let current = query;
  if (populate && typeof current?.populate === "function") {
    current = current.populate(populate.path, populate.select);
  }
  if (typeof current?.lean === "function") current = current.lean();
  return await current;
}

async function loadById(Model, id, populate) {
  if (!Model || typeof Model.findById !== "function") {
    throw new TypeError("Automation handler model must implement findById");
  }
  return resolveQuery(Model.findById(id), populate);
}

function activeQuote(quote) {
  return Boolean(quote && quote.isDeleted !== true);
}

function referenceFor(entity, fallback) {
  return entity?.reference || entity?.quoteReference || String(fallback || entity?._id || "");
}

function resultError(result, label) {
  return new Error(result?.error || `${label} failed`);
}

function requireMailSuccess(result, label) {
  if (result?.success === true) return result;
  throw resultError(result, label);
}

function requireOutboundSuccess(result, label) {
  if (result?.success === true || result?.skipped === true) return result;
  throw resultError(result, label);
}

function quoteStampFilter(quote, field, extra = {}) {
  return {
    _id: quote._id,
    ...extra,
    [field]: { $exists: false },
  };
}

function spamReasons(entity) {
  return Array.isArray(entity?.suspicionReasons)
    ? entity.suspicionReasons.join(", ")
    : "Unspecified";
}

async function gatherDailyDigestStats({
  now,
  QuoteModel,
  ChatLeadModel,
  QuotePaymentModel,
}) {
  const dayAgo = new Date(now.getTime() - 24 * HOUR_MS);
  const stuckCutoff = new Date(now.getTime() - 24 * HOUR_MS);
  const [newQuotes24h, newChatLeads24h, pendingRows, stuckQuotes] =
    await Promise.all([
      QuoteModel.countDocuments({
        createdAt: { $gte: dayAgo },
        isDeleted: { $ne: true },
      }),
      ChatLeadModel.countDocuments({ createdAt: { $gte: dayAgo } }),
      QuotePaymentModel.aggregate([
        { $match: { status: "pending" } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: "$amount" },
          },
        },
      ]),
      QuoteModel.countDocuments({
        status: "new",
        isDeleted: { $ne: true },
        createdAt: { $lte: stuckCutoff },
      }),
    ]);
  const pending = pendingRows?.[0] || {};

  return {
    newQuotes24h,
    newChatLeads24h,
    pendingPaymentsCount: pending.count || 0,
    pendingPaymentsTotal: Number(pending.total || 0),
    stuckQuotes,
  };
}

export function createAutomationHandlers(overrides = {}) {
  const dependencies = mergeDependencies(overrides);
  const {
    QuoteModel,
    ChatLeadModel,
    BookingModel,
    QuotePaymentModel,
    now,
  } = dependencies;

  return {
    "quote.client-confirmation": async (job) => {
      const quote = await loadById(QuoteModel, job.entityId);
      if (!activeQuote(quote) || quote.confirmationEmailSent === true || !quote.email) {
        return NO_OP;
      }

      const result = await dependencies.sendClientConfirmationEmail(
        quote.email,
        quote.firstName,
        referenceFor(quote, job.entityId),
      );
      requireMailSuccess(result, "Quote client confirmation email");
      await QuoteModel.updateOne(
        { _id: quote._id, confirmationEmailSent: { $ne: true } },
        { $set: { confirmationEmailSent: true } },
      );
      return result;
    },

    "quote.admin-notification": async (job) => {
      const quote = await loadById(QuoteModel, job.entityId);
      if (!activeQuote(quote) || quote.adminEmailSent === true) return NO_OP;

      const result = await dependencies.sendAdminNotificationEmail(quote);
      requireMailSuccess(result, "Quote admin notification email");
      await QuoteModel.updateOne(
        { _id: quote._id, adminEmailSent: { $ne: true } },
        { $set: { adminEmailSent: true } },
      );
      return result;
    },

    "quote.approved-response": async (job) => {
      const quote = await loadById(QuoteModel, job.entityId);
      const responseVersion = job.payload?.responseVersion;
      if (
        !activeQuote(quote) ||
        quote.status !== "converted" ||
        !quote.email ||
        responseVersion === undefined ||
        responseVersion === null ||
        quote.responseVersion !== responseVersion
      ) {
        return NO_OP;
      }

      const result = await dependencies.sendQuoteApprovedEmail(
        quote.email,
        quote.firstName,
        referenceFor(quote, job.entityId),
        {
          approvedAmount: quote.approvedAmount,
          customerMessage: quote.customerMessage,
        },
      );
      return requireMailSuccess(result, "Quote approval response email");
    },

    "quote.lead-webhook": async (job) => {
      const quote = await loadById(QuoteModel, job.entityId);
      if (!activeQuote(quote)) return NO_OP;
      const result = await dependencies.notifyNewQuote(quote);
      return requireOutboundSuccess(result, "Quote lead webhook");
    },

    "quote.spam-alert": async (job) => {
      const quote = await loadById(QuoteModel, job.entityId);
      if (
        !activeQuote(quote) ||
        quote.suspectedSpam !== true ||
        quote.suspicionReviewedAt
      ) {
        return NO_OP;
      }
      const result = await dependencies.notifyAdminAlert(
        `Suspected spam quote ${referenceFor(quote, job.entityId)}`,
        [
          `Customer: ${quote.firstName || ""} ${quote.lastName || ""}`.trim(),
          `Email: ${quote.email || ""}`,
          `Reasons: ${spamReasons(quote)}`,
          `CAPTCHA: ${Math.round((quote.captchaScore || 0) * 100)}%`,
        ].join("\n"),
      );
      return requireOutboundSuccess(result, "Quote spam alert");
    },

    "chat-lead.hot-webhook": async (job) => {
      const lead = await loadById(ChatLeadModel, job.entityId);
      const isHot = Boolean(lead?.phone && (lead.postcode || lead.serviceType));
      if (!isHot) return NO_OP;
      const result = await dependencies.notifyHotChatLead(lead);
      return requireOutboundSuccess(result, "Hot chat lead webhook");
    },

    "chat-lead.spam-alert": async (job) => {
      const lead = await loadById(ChatLeadModel, job.entityId);
      if (
        !lead ||
        lead.suspectedSpam !== true ||
        lead.suspicionReviewedAt
      ) {
        return NO_OP;
      }
      const result = await dependencies.notifyAdminAlert(
        `Suspected spam chat lead: ${lead.name || job.entityId}`,
        [
          `Contact: ${[lead.phone, lead.email].filter(Boolean).join(" / ") || "-"}`,
          `Reasons: ${spamReasons(lead)}`,
        ].join("\n"),
      );
      return requireOutboundSuccess(result, "Chat lead spam alert");
    },

    "domain.event": async (job) => {
      const event = job.payload?.event;
      if (!event) throw new Error("Domain event job is missing its event name");
      const eventId = String(job._id || job.dedupeKey || `${event}:${job.entityId}`);
      const result = await dependencies.dispatchEvent(
        event,
        job.payload?.data || {},
        { eventId },
      );
      return requireOutboundSuccess(result, "Domain event dispatch");
    },

    "quote.stuck-reminder": async (job) => {
      const quote = await loadById(QuoteModel, job.entityId);
      const timestamp = currentDate(now);
      if (
        !activeQuote(quote) ||
        quote.status !== "new" ||
        quote.stuckReminderSentAt ||
        !isDue(quote.createdAt, 24, timestamp)
      ) {
        return NO_OP;
      }

      const result = await dependencies.sendStuckQuoteReminderEmail([quote]);
      requireMailSuccess(result, "Stuck quote reminder email");
      await QuoteModel.updateOne(
        quoteStampFilter(quote, "stuckReminderSentAt", { status: "new" }),
        { $set: { stuckReminderSentAt: timestamp } },
      );
      return result;
    },

    "quote.client-follow-up": async (job) => {
      const quote = await loadById(QuoteModel, job.entityId);
      const timestamp = currentDate(now);
      if (
        !activeQuote(quote) ||
        quote.status !== "new" ||
        quote.clientFollowUpSentAt ||
        !quote.email ||
        !isDue(quote.createdAt, 24, timestamp)
      ) {
        return NO_OP;
      }

      const result = await dependencies.sendClientFollowUpEmail(
        quote.email,
        quote.firstName || "there",
        referenceFor(quote, job.entityId),
      );
      requireMailSuccess(result, "Quote client follow-up email");
      await QuoteModel.updateOne(
        quoteStampFilter(quote, "clientFollowUpSentAt", { status: "new" }),
        { $set: { clientFollowUpSentAt: timestamp } },
      );
      return result;
    },

    "quote.payment-reminder": async (job) => {
      const quote = await loadById(QuoteModel, job.entityId);
      const timestamp = currentDate(now);
      const expectedConvertedAt = job.payload?.convertedAt;
      if (
        !activeQuote(quote) ||
        quote.status !== "converted" ||
        quote.paymentReminderSentAt ||
        !quote.email ||
        !isDue(quote.convertedAt, 48, timestamp) ||
        (expectedConvertedAt && !sameInstant(expectedConvertedAt, quote.convertedAt))
      ) {
        return NO_OP;
      }

      const stampFilter = quoteStampFilter(quote, "paymentReminderSentAt", {
        status: "converted",
        convertedAt: quote.convertedAt,
      });
      const paid = await QuotePaymentModel.exists({
        quoteId: quote._id,
        status: "succeeded",
      });
      if (paid) {
        await QuoteModel.updateOne(stampFilter, {
          $set: { paymentReminderSentAt: timestamp },
        });
        return NO_OP;
      }

      const result = await dependencies.sendPaymentReminderEmail(
        quote.email,
        quote.firstName || "there",
        referenceFor(quote, job.entityId),
        quote.approvedAmount,
      );
      requireMailSuccess(result, "Quote payment reminder email");
      await QuoteModel.updateOne(stampFilter, {
        $set: { paymentReminderSentAt: timestamp },
      });
      return result;
    },

    "booking.satisfaction-follow-up": async (job) => {
      const booking = await loadById(BookingModel, job.entityId, {
        path: "userId",
        select: "email firstName",
      });
      const timestamp = currentDate(now);
      const expectedCompletedAt = job.payload?.completedAt;
      if (
        !booking ||
        booking.status !== "completed" ||
        booking.satisfactionEmailSentAt ||
        !isDue(booking.completedAt, 48, timestamp) ||
        (expectedCompletedAt && !sameInstant(expectedCompletedAt, booking.completedAt))
      ) {
        return NO_OP;
      }
      const email = booking.customerEmail || booking.userId?.email;
      if (!email) return NO_OP;

      const result = await dependencies.sendSatisfactionFollowUpEmail(
        email,
        booking.customerFirstName || booking.userId?.firstName || "there",
        referenceFor(booking, job.entityId),
      );
      requireMailSuccess(result, "Booking satisfaction follow-up email");
      await BookingModel.updateOne(
        {
          _id: booking._id,
          status: "completed",
          completedAt: booking.completedAt,
          satisfactionEmailSentAt: { $exists: false },
        },
        { $set: { satisfactionEmailSentAt: timestamp } },
      );
      return result;
    },

    "ops.daily-digest": async () => {
      const stats = await gatherDailyDigestStats({
        now: currentDate(now),
        QuoteModel,
        ChatLeadModel,
        QuotePaymentModel,
      });
      const result = await dependencies.sendDailyDigestEmail(stats);
      return requireMailSuccess(result, "Daily operations digest email");
    },
  };
}

export const defaultHandlers = createAutomationHandlers();

export default defaultHandlers;
