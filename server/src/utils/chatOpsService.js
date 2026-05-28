/**
 * CHATOPS SERVICE
 * Parses and executes admin commands from Slack, Discord, or any HTTP client
 * that sends a shared secret (CHATOPS_SECRET).
 *
 * Examples:
 *   quote AP12345678 contacted
 *   quote AP12345678 converted 150
 *   lead 663abc123 contacted
 *   stats
 *   help
 */

import crypto from "crypto";
import Quote from "../models/Quote.js";
import ChatLead from "../models/ChatLead.js";
import Booking from "../../models/Booking.js";
import QuotePayment from "../../models/QuotePayment.js";
import { sendQuoteApprovedEmail } from "./emailService.js";
import { emitEvent } from "./eventBus.js";

const QUOTE_STATUSES = ["new", "contacted", "converted", "rejected"];
const LEAD_STATUSES = ["new", "contacted", "qualified", "closed"];

const SERVICE_NAMES = {
  residential: "Residential Cleaning",
  "end-of-tenancy": "End of Tenancy Cleaning",
  airbnb: "Airbnb Turnover Cleaning",
  commercial: "Commercial Cleaning",
};

function formatSlack(text) {
  return { response_type: "ephemeral", text: String(text).slice(0, 3000) };
}

function formatInChannel(text) {
  return { response_type: "in_channel", text: String(text).slice(0, 3000) };
}

async function findQuoteByRef(ref) {
  const trimmed = String(ref || "").trim().toUpperCase();
  if (/^AP\d{8}$/.test(trimmed)) {
    return Quote.findOne({ reference: trimmed, isDeleted: { $ne: true } });
  }
  if (/^[a-f0-9]{24}$/i.test(trimmed)) {
    return Quote.findOne({ _id: trimmed, isDeleted: { $ne: true } });
  }
  return null;
}

async function ensureDraftBookingForQuote(quote) {
  if (!quote?._id) return null;
  if (quote.linkedBookingId) {
    return Booking.findById(quote.linkedBookingId);
  }
  const existing = await Booking.findOne({ quoteId: quote._id });
  if (existing) {
    await Quote.updateOne({ _id: quote._id }, { $set: { linkedBookingId: existing._id } });
    return existing;
  }

  const amount = Number(quote.approvedAmount) > 0 ? Number(quote.approvedAmount) : 0;
  const draft = await Booking.create({
    quoteId: quote._id,
    quoteReference: quote.reference,
    customerEmail: quote.email,
    customerFirstName: quote.firstName,
    customerLastName: quote.lastName,
    customerPhone: quote.phone,
    serviceId: ["residential", "end-of-tenancy", "airbnb", "commercial"].includes(quote.serviceType)
      ? quote.serviceType
      : undefined,
    serviceName: SERVICE_NAMES[quote.serviceType] || quote.serviceType,
    address: {
      street: quote.address,
      postCode: quote.postcode,
      country: "UK",
    },
    notes: quote.additionalNotes,
    basePrice: amount,
    totalPrice: amount,
    status: "draft",
    paymentStatus: "pending",
  });
  await Quote.updateOne({ _id: quote._id }, { $set: { linkedBookingId: draft._id } });
  return draft;
}

async function handleQuoteCommand(args) {
  const [ref, status, amountRaw] = args;
  if (!ref || !status) {
    return formatSlack("Usage: `quote AP12345678 contacted|converted|rejected|new [amount]`");
  }
  if (!QUOTE_STATUSES.includes(status)) {
    return formatSlack(`Invalid quote status. Use: ${QUOTE_STATUSES.join(", ")}`);
  }

  const quote = await findQuoteByRef(ref);
  if (!quote) {
    return formatSlack(`Quote not found: ${ref}`);
  }

  const previousStatus = quote.status;
  const update = { status };
  if (status === "converted") {
    const amount = Number(amountRaw);
    if (Number.isFinite(amount) && amount > 0) {
      update.approvedAmount = Math.round(amount * 100) / 100;
    }
    if (previousStatus !== "converted") {
      update.convertedAt = new Date();
      update.paymentReminderSentAt = undefined;
    }
  }

  const updated = await Quote.findOneAndUpdate(
    { _id: quote._id, isDeleted: { $ne: true } },
    update,
    { new: true },
  );

  if (status === "converted" && previousStatus !== "converted") {
    try {
      await sendQuoteApprovedEmail(
        updated.email,
        updated.firstName,
        updated.reference || String(updated._id),
      );
    } catch (err) {
      console.warn("ChatOps quote approved email failed:", err.message);
    }
    try {
      const draft = await ensureDraftBookingForQuote(updated);
      if (draft) {
        emitEvent("booking.draft_created", {
          bookingId: String(draft._id),
          quoteReference: updated.reference,
          status: draft.status,
          customerEmail: updated.email,
          serviceType: updated.serviceType,
        });
      }
    } catch (err) {
      console.warn("ChatOps draft booking failed:", err.message);
    }
    emitEvent("quote.converted", {
      quoteId: String(updated._id),
      reference: updated.reference,
      email: updated.email,
      serviceType: updated.serviceType,
      approvedAmount: updated.approvedAmount,
      previousStatus,
    });
  }

  return formatInChannel(
    `✅ Quote *${updated.reference || updated._id}* updated: \`${previousStatus}\` → \`${updated.status}\`${
      updated.approvedAmount ? ` · £${Number(updated.approvedAmount).toFixed(2)}` : ""
    }`,
  );
}

async function handleLeadCommand(args) {
  const [id, status] = args;
  if (!id || !status) {
    return formatSlack("Usage: `lead <leadId> contacted|qualified|closed|new`");
  }
  if (!LEAD_STATUSES.includes(status)) {
    return formatSlack(`Invalid lead status. Use: ${LEAD_STATUSES.join(", ")}`);
  }

  const lead = await ChatLead.findByIdAndUpdate(id, { status }, { new: true }).lean();
  if (!lead) {
    return formatSlack(`Chat lead not found: ${id}`);
  }

  return formatInChannel(
    `✅ Chat lead *${lead.name}* (${lead._id}) → \`${status}\`${lead.serviceType ? ` · ${lead.serviceType}` : ""}`,
  );
}

async function handleStatsCommand() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [newQuotes, newLeads, stuckQuotes, pendingPayments] = await Promise.all([
    Quote.countDocuments({ createdAt: { $gte: dayAgo }, isDeleted: { $ne: true } }),
    ChatLead.countDocuments({ createdAt: { $gte: dayAgo } }),
    Quote.countDocuments({
      status: "new",
      isDeleted: { $ne: true },
      createdAt: { $lte: dayAgo },
    }),
    QuotePayment.countDocuments({ status: "pending" }),
  ]);

  return formatSlack(
    [
      "*Apex Five — 24h ops snapshot*",
      `• New quotes: ${newQuotes}`,
      `• Chat leads: ${newLeads}`,
      `• Stuck quotes (>24h): ${stuckQuotes}`,
      `• Pending payments: ${pendingPayments}`,
    ].join("\n"),
  );
}

function handleHelpCommand() {
  return formatSlack(
    [
      "*Apex Five ChatOps*",
      "`quote AP12345678 contacted` — update quote status",
      "`quote AP12345678 converted 150` — approve quote with amount",
      "`lead <id> contacted` — update chat lead status",
      "`stats` — 24h snapshot",
      "`help` — this message",
    ].join("\n"),
  );
}

/**
 * @param {string} rawText
 * @returns {Promise<{ response_type: string, text: string }>}
 */
export async function executeChatOpsCommand(rawText) {
  const text = String(rawText || "").trim().replace(/^\//, "");
  if (!text) return handleHelpCommand();

  const parts = text.split(/\s+/);
  const command = parts[0]?.toLowerCase();

  switch (command) {
    case "quote":
    case "admin-quote":
      return handleQuoteCommand(parts.slice(1));
    case "lead":
    case "chat-lead":
      return handleLeadCommand(parts.slice(1));
    case "stats":
      return handleStatsCommand();
    case "help":
      return handleHelpCommand();
    default:
      return formatSlack(`Unknown command \`${command}\`. Type \`help\` for options.`);
  }
}

export function isChatOpsConfigured() {
  return Boolean(
    (process.env.CHATOPS_SECRET && process.env.CHATOPS_SECRET.trim()) ||
      (process.env.SLACK_SIGNING_SECRET && process.env.SLACK_SIGNING_SECRET.trim()) ||
      (process.env.DISCORD_PUBLIC_KEY && process.env.DISCORD_PUBLIC_KEY.trim()),
  );
}

export function verifyChatOpsSecret(headerValue) {
  const secret = process.env.CHATOPS_SECRET?.trim();
  if (!secret || !headerValue) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(String(headerValue)),
      Buffer.from(secret),
    );
  } catch {
    return false;
  }
}

export function verifySlackSignature(rawBody, timestamp, signature) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET?.trim();
  if (!signingSecret || !signature || !timestamp) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 60 * 5) return false;

  const base = `v0:${timestamp}:${rawBody}`;
  const expected =
    "v0=" + crypto.createHmac("sha256", signingSecret).update(base).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function verifyDiscordInteraction(rawBody, signature, timestamp) {
  const publicKeyHex = process.env.DISCORD_PUBLIC_KEY?.trim();
  if (!publicKeyHex || !signature || !timestamp) return false;

  try {
    const verify = crypto.createVerify("Ed25519");
    verify.update(timestamp + rawBody);
    verify.end();
    return verify.verify(
      Buffer.from(publicKeyHex, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}

export function parseDiscordInteraction(body) {
  if (body?.type === 1) {
    return { kind: "ping" };
  }
  if (body?.type === 2 && body?.data?.name) {
    const collectValues = (options = []) =>
      options
        .flatMap((opt) => {
          if (opt.type === 1 && Array.isArray(opt.options)) {
            return collectValues(opt.options);
          }
          if (opt.type === 3 && opt.value) {
            return [String(opt.value).trim()];
          }
          return [];
        })
        .filter(Boolean);

    const args = collectValues(body.data.options);
    return { kind: "command", command: body.data.name, args };
  }
  return { kind: "unknown" };
}
