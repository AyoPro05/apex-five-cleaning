import Payment from "../../models/Payment.js";
import QuotePayment from "../../models/QuotePayment.js";

const REVIEW_DELAY_MS = 48 * 60 * 60 * 1000;

// Join payments before limiting results, so unpaid jobs cannot crowd paid jobs
// out of every discovery batch. Both payment paths use their original paid time.
export function findReviewFollowUpCandidates(BookingModel, now, limit) {
  const cutoff = new Date(now.getTime() - REVIEW_DELAY_MS);
  const latestSuccessfulPayment = [
    { $match: { status: "succeeded", processedAt: { $type: "date" } } },
    { $sort: { processedAt: -1 } },
    { $limit: 1 },
    { $project: { processedAt: 1 } },
  ];
  return BookingModel.aggregate([
    { $match: {
      status: "completed",
      paymentStatus: { $ne: "refunded" },
      completedAt: { $lte: cutoff },
      satisfactionEmailSentAt: { $exists: false },
    } },
    { $lookup: { from: Payment.collection.name, localField: "_id", foreignField: "bookingId", pipeline: latestSuccessfulPayment, as: "reviewBookingPayments" } },
    { $lookup: { from: QuotePayment.collection.name, localField: "quoteId", foreignField: "quoteId", pipeline: latestSuccessfulPayment, as: "reviewQuotePayments" } },
    { $set: { reviewPaidAt: { $max: [
      { $arrayElemAt: ["$reviewBookingPayments.processedAt", 0] },
      { $arrayElemAt: ["$reviewQuotePayments.processedAt", 0] },
    ] } } },
    { $match: { reviewPaidAt: { $ne: null, $lte: cutoff } } },
    { $sort: { completedAt: 1, _id: 1 } },
    { $limit: limit },
    { $project: { _id: 1, completedAt: 1, reviewPaidAt: 1 } },
  ]);
}

// Recheck the source records when a queued message is about to be sent.
export async function getReviewFollowUpPaidAt(booking, { PaymentModel = Payment, QuotePaymentModel = QuotePayment } = {}) {
  const payments = await Promise.all([
    PaymentModel.findOne({ bookingId: booking._id, status: "succeeded" }).sort({ processedAt: -1 }).lean(),
    booking.quoteId
      ? QuotePaymentModel.findOne({ quoteId: booking.quoteId, status: "succeeded" }).sort({ processedAt: -1 }).lean()
      : null,
  ]);
  const times = payments
    .filter((payment) => payment?.processedAt)
    .map((payment) => new Date(payment.processedAt).getTime())
    .filter(Number.isFinite);
  return times.length ? new Date(Math.max(...times)) : null;
}
