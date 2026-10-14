import Quote from "../models/Quote.js";
import Booking from "../../models/Booking.js";
import defaultQueue from "./automationQueue.js";

const STATUSES = ["new", "contacted", "converted", "rejected"];
const FIELDS = new Set(["status", "approvedAmount", "customerMessage", "adminNotes", "clearSuspicion"]);
const SERVICE_NAMES = { residential: "Residential Cleaning", "end-of-tenancy": "End of Tenancy Cleaning", airbnb: "Airbnb Turnover Cleaning", commercial: "Commercial Cleaning" };

function invalid(message, field) {
  return Object.assign(new Error(message), { status: 400, errors: field ? { [field]: message } : undefined });
}

function validateInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input) || !Object.keys(input).length) throw invalid("Provide quote changes");
  for (const field of Object.keys(input)) if (!FIELDS.has(field)) throw invalid("Unknown quote field", field);
  if (input.status !== undefined && !STATUSES.includes(input.status)) throw invalid("Invalid status", "status");
  const normalized = { ...input };
  for (const [field, limit] of [["customerMessage", 1000], ["adminNotes", 5000]]) {
    if (input[field] !== undefined) {
      if (typeof input[field] !== "string" || input[field].trim().length > limit) throw invalid(`Maximum ${limit} characters`, field);
      normalized[field] = input[field].trim();
    }
  }
  if (input.clearSuspicion !== undefined && typeof input.clearSuspicion !== "boolean") throw invalid("Invalid spam review value", "clearSuspicion");
  if (input.approvedAmount !== undefined) {
    if (!["number", "string"].includes(typeof input.approvedAmount) || input.approvedAmount === "") throw invalid("Enter a valid amount", "approvedAmount");
    const amount = Math.round(Number(input.approvedAmount) * 100) / 100;
    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) throw invalid("Enter an amount between £0.01 and £1,000,000", "approvedAmount");
    normalized.approvedAmount = amount;
  }
  return normalized;
}

async function lean(query) {
  return typeof query?.lean === "function" ? query.lean() : query;
}

export function createQuoteWorkflowService({ QuoteModel = Quote, BookingModel = Booking, queue = defaultQueue, now = () => new Date() } = {}) {
  async function ensureBooking(quote) {
    if (typeof BookingModel.init === "function") await BookingModel.init();
    let booking;
    try {
      booking = await lean(BookingModel.findOneAndUpdate(
        { quoteId: quote._id },
        { $setOnInsert: {
          quoteId: quote._id, quoteReference: quote.reference,
          customerEmail: quote.email, customerFirstName: quote.firstName,
          customerLastName: quote.lastName, customerPhone: quote.phone,
          serviceId: quote.serviceType, serviceName: SERVICE_NAMES[quote.serviceType] || quote.serviceType,
          address: { street: quote.address, postCode: quote.postcode, country: "UK" },
          notes: String(quote.additionalNotes || "").slice(0, 500),
          basePrice: quote.approvedAmount, totalPrice: quote.approvedAmount,
          status: "draft", paymentStatus: "pending",
        } },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
      ));
    } catch (error) {
      if (error.code !== 11000) throw error;
      booking = await lean(BookingModel.findOne({ quoteId: quote._id }));
      if (!booking) throw error;
    }
    await BookingModel.updateOne(
      { quoteId: quote._id, status: "draft" },
      { $set: { basePrice: quote.approvedAmount, totalPrice: quote.approvedAmount } },
    );
    return booking;
  }

  async function updateQuote({ quoteId, input }) {
    const changes = validateInput(input);
    let quote;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const previous = await lean(QuoteModel.findOne({ _id: quoteId, isDeleted: { $ne: true } }));
      if (!previous) throw Object.assign(new Error("Quote not found"), { status: 404 });
      const status = changes.status ?? previous.status;
      const approvedAmount = changes.approvedAmount ?? previous.approvedAmount;
      if (status === "converted" && (!Number.isFinite(approvedAmount) || approvedAmount < 0.01 || approvedAmount > 1_000_000)) throw invalid("A positive approved amount is required", "approvedAmount");
      const customerMessage = changes.customerMessage ?? previous.customerMessage ?? "";
      const responseChanged = status === "converted" && (
        previous.status !== "converted" || !previous.responseVersion ||
        previous.approvedAmount !== approvedAmount || (previous.customerMessage || "") !== customerMessage
      );
      const set = {};
      for (const field of ["status", "approvedAmount", "customerMessage", "adminNotes"]) {
        if (changes[field] !== undefined) set[field] = changes[field];
      }
      const unset = {};
      if (changes.clearSuspicion === true) Object.assign(set, { suspectedSpam: false, suspicionReasons: [], suspicionReviewedAt: now() });
      if (responseChanged) {
        Object.assign(set, { responseVersion: (previous.responseVersion || 0) + 1, customerMessage, approvedAmount });
        if (previous.status !== "converted") {
          set.convertedAt = now();
          unset.paymentReminderSentAt = 1;
        }
      }
      const filter = {
        _id: quoteId, isDeleted: { $ne: true }, status: previous.status,
        responseVersion: previous.responseVersion === undefined ? { $exists: false } : previous.responseVersion,
        ...(previous.updatedAt ? { updatedAt: previous.updatedAt } : {}),
      };
      quote = await lean(QuoteModel.findOneAndUpdate(filter, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { new: true, runValidators: true }));
      if (quote) break;
    }
    if (!quote) throw Object.assign(new Error("Quote changed concurrently; please retry"), { status: 409 });
    if (quote.status !== "converted") return { quote, booking: null, responseJob: null };

    const booking = await ensureBooking(quote);
    const linked = await lean(QuoteModel.findOneAndUpdate(
      { _id: quote._id, status: "converted", responseVersion: quote.responseVersion },
      { $set: { linkedBookingId: booking._id, lastResponseQueuedAt: now() } },
      { new: true },
    ));
    const responseJob = await queue.enqueue({
      type: "quote.approved-response", dedupeKey: `quote.approved-response:${quote._id}:v${quote.responseVersion}`,
      entityType: "Quote", entityId: String(quote._id), payload: { responseVersion: quote.responseVersion },
    });
    await queue.enqueue({
      type: "domain.event", dedupeKey: `domain.event:booking.draft_created:${booking._id}`,
      entityType: "Booking", entityId: String(booking._id),
      payload: { event: "booking.draft_created", data: { bookingId: String(booking._id), quoteId: String(quote._id), status: booking.status } },
    });
    await queue.enqueue({
      type: "domain.event", dedupeKey: `domain.event:quote.converted:${quote._id}:v${quote.responseVersion}`,
      entityType: "Quote", entityId: String(quote._id),
      payload: { event: "quote.converted", data: { quoteId: String(quote._id), reference: quote.reference, approvedAmount: quote.approvedAmount } },
    });
    return { quote: linked || quote, booking, responseJob };
  }
  return { updateQuote };
}

export const quoteWorkflowService = createQuoteWorkflowService();
