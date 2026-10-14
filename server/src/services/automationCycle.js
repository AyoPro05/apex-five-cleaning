import { randomUUID } from "node:crypto";

import Booking from "../../models/Booking.js";
import QuotePayment from "../../models/QuotePayment.js";
import AutomationRun from "../models/AutomationRun.js";
import Quote from "../models/Quote.js";
import { captureServerException } from "../utils/sentry.js";
import defaultHandlers from "./automationHandlers.js";
import defaultQueue from "./automationQueue.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const CANDIDATE_LIMIT = 50;
const MAX_CONCURRENCY = 4;
const ERROR_SUMMARY_LIMIT = 500;

function asDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizedNow(value) {
  return asDate(typeof value === "function" ? value() : value) || new Date();
}

function createWorkerId() {
  const region = process.env.VERCEL_REGION || "local";
  return `${region}:${process.pid}:${randomUUID()}`;
}

function emptyCounts() {
  return {
    enqueued: 0,
    completed: 0,
    retried: 0,
    failed: 0,
    purged: 0,
  };
}

function boundedError(error) {
  return String(error?.message || error || "Automation cycle failed").slice(
    0,
    ERROR_SUMMARY_LIMIT,
  );
}

async function findCandidates(Model, filter, selection) {
  let query = Model.find(filter);
  if (selection && typeof query?.select === "function") {
    query = query.select(selection);
  }
  if (typeof query?.limit === "function") query = query.limit(CANDIDATE_LIMIT);
  if (typeof query?.lean === "function") query = query.lean();
  const rows = await query;
  return Array.isArray(rows) ? rows : [];
}

function stableDate(value) {
  const date = asDate(value);
  return date ? date.toISOString() : null;
}

export async function enqueueDueAutomationJobs({
  now = new Date(),
  queue = defaultQueue,
  QuoteModel = Quote,
  BookingModel = Booking,
  QuotePaymentModel = QuotePayment,
} = {}) {
  const timestamp = normalizedNow(now);
  const oneDayAgo = new Date(timestamp.getTime() - DAY_MS);
  const twoDaysAgo = new Date(timestamp.getTime() - 2 * DAY_MS);
  const retentionCutoff = new Date(timestamp.getTime() - 30 * DAY_MS);

  const purgeResult = await QuoteModel.deleteMany({
    isDeleted: true,
    deletedAt: { $lte: retentionCutoff },
  });

  const [stuckQuotes, clientFollowUps, paymentReminders, satisfactionFollowUps] =
    await Promise.all([
      findCandidates(
        QuoteModel,
        {
          status: "new",
          isDeleted: { $ne: true },
          createdAt: { $lte: oneDayAgo },
          stuckReminderSentAt: { $exists: false },
        },
        "_id",
      ),
      findCandidates(
        QuoteModel,
        {
          status: "new",
          isDeleted: { $ne: true },
          createdAt: { $lte: oneDayAgo },
          clientFollowUpSentAt: { $exists: false },
        },
        "_id",
      ),
      findCandidates(
        QuoteModel,
        {
          status: "converted",
          isDeleted: { $ne: true },
          convertedAt: { $lte: twoDaysAgo },
          paymentReminderSentAt: { $exists: false },
        },
        "_id convertedAt",
      ),
      findCandidates(
        BookingModel,
        {
          status: "completed",
          completedAt: { $lte: twoDaysAgo },
          satisfactionEmailSentAt: { $exists: false },
        },
        "_id completedAt",
      ),
    ]);

  const jobs = [];
  for (const quote of stuckQuotes) {
    const entityId = String(quote._id);
    jobs.push({
      type: "quote.stuck-reminder",
      dedupeKey: `quote.stuck-reminder:${entityId}`,
      entityType: "Quote",
      entityId,
      payload: {},
    });
  }
  for (const quote of clientFollowUps) {
    const entityId = String(quote._id);
    jobs.push({
      type: "quote.client-follow-up",
      dedupeKey: `quote.client-follow-up:${entityId}`,
      entityType: "Quote",
      entityId,
      payload: {},
    });
  }
  for (const quote of paymentReminders) {
    const convertedAt = stableDate(quote.convertedAt);
    if (!convertedAt) continue;
    const entityId = String(quote._id);
    const paid = await QuotePaymentModel.exists({
      quoteId: quote._id,
      status: "succeeded",
    });
    if (paid) {
      await QuoteModel.updateOne(
        {
          _id: quote._id,
          status: "converted",
          convertedAt: quote.convertedAt,
          paymentReminderSentAt: { $exists: false },
        },
        { $set: { paymentReminderSentAt: timestamp } },
      );
      continue;
    }
    jobs.push({
      type: "quote.payment-reminder",
      dedupeKey: `quote.payment-reminder:${entityId}:${convertedAt}`,
      entityType: "Quote",
      entityId,
      payload: { convertedAt },
    });
  }
  for (const booking of satisfactionFollowUps) {
    const completedAt = stableDate(booking.completedAt);
    if (!completedAt) continue;
    const entityId = String(booking._id);
    jobs.push({
      type: "booking.satisfaction-follow-up",
      dedupeKey: `booking.satisfaction-follow-up:${entityId}:${completedAt}`,
      entityType: "Booking",
      entityId,
      payload: { completedAt },
    });
  }

  const dateKey = timestamp.toISOString().slice(0, 10);
  jobs.push({
    type: "ops.daily-digest",
    dedupeKey: `ops.daily-digest:${dateKey}`,
    entityType: "Operations",
    entityId: dateKey,
    payload: { dateKey },
  });

  for (const job of jobs) await queue.enqueue(job);

  return {
    enqueued: jobs.length,
    purged: Number(purgeResult?.deletedCount || 0),
  };
}

function captureTerminalFailure(captureException, job) {
  try {
    // Provider errors can contain recipient data; report only the job identity.
    captureException(new Error("Automation job failed"), {
      tags: {
        jobId: String(job._id),
        jobType: String(job.type),
      },
    });
  } catch {
    // Monitoring must never prevent the durable queue transition.
  }
}

export async function drainAutomationJobs({
  limit = 20,
  concurrency = 4,
  queue = defaultQueue,
  handlers = defaultHandlers,
  captureException = captureServerException,
} = {}) {
  const numericLimit = Number(limit);
  const requestedLimit = Number.isFinite(numericLimit)
    ? Math.max(0, Math.trunc(numericLimit))
    : 0;
  const workerCount = Math.min(
    MAX_CONCURRENCY,
    Math.max(1, Math.trunc(Number(concurrency) || 1)),
    Math.max(1, requestedLimit),
  );
  const counts = {
    claimed: 0,
    completed: 0,
    retried: 0,
    failed: 0,
  };
  if (requestedLimit === 0) return counts;

  let claimSlots = 0;
  let exhausted = false;

  async function worker() {
    while (!exhausted && claimSlots < requestedLimit) {
      claimSlots += 1;
      const job = await queue.claimNext();
      if (!job) {
        exhausted = true;
        return;
      }
      counts.claimed += 1;

      try {
        const handler = handlers?.[job.type];
        if (typeof handler !== "function") {
          throw new Error(`No automation handler registered for type ${job.type}`);
        }
        await handler(job);
        const completedJob = await queue.complete(job);
        if (completedJob?.status === "completed") counts.completed += 1;
      } catch (error) {
        const failedJob = await queue.fail(job, error);
        // A null result means another invocation owns the job's current lease.
        if (failedJob?.status === "failed") {
          counts.failed += 1;
          captureTerminalFailure(captureException, job);
        } else if (failedJob?.status === "pending") {
          counts.retried += 1;
        }
      }
    }
  }

  const results = await Promise.allSettled(
    Array.from({ length: workerCount }, () => worker().catch((error) => {
      exhausted = true;
      throw error;
    })),
  );
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
  return counts;
}

export async function runAutomationCycle(options = {}) {
  const {
    queue = defaultQueue,
    handlers = defaultHandlers,
    trigger = "manual",
    workerId = createWorkerId(),
    AutomationRunModel = AutomationRun,
    enqueueDue = enqueueDueAutomationJobs,
    drain = drainAutomationJobs,
    captureException = captureServerException,
    limit = 20,
    concurrency = 4,
  } = options;
  const fixedNow = options.now;
  const clock =
    options.clock ||
    (() => (fixedNow === undefined ? new Date() : normalizedNow(fixedNow)));
  const startedAt = normalizedNow(clock());
  const counts = emptyCounts();
  let run;

  try {
    run = await AutomationRunModel.create({
      startedAt,
      trigger,
      workerId,
      status: "running",
      counts: { ...counts },
    });

    const discovery = await enqueueDue({
      now: fixedNow === undefined ? startedAt : normalizedNow(fixedNow),
      queue,
      QuoteModel: options.QuoteModel,
      BookingModel: options.BookingModel,
      QuotePaymentModel: options.QuotePaymentModel,
    });
    counts.enqueued = Number(discovery?.enqueued || 0);
    counts.purged = Number(discovery?.purged || 0);

    const drained = await drain({
      limit,
      concurrency,
      queue,
      handlers,
      captureException,
    });
    counts.completed = Number(drained?.completed || 0);
    counts.retried = Number(drained?.retried || 0);
    counts.failed = Number(drained?.failed || 0);

    const finishedAt = normalizedNow(clock());
    await AutomationRunModel.updateOne(
      { _id: run._id },
      {
        $set: {
          finishedAt,
          status: "completed",
          counts: { ...counts },
        },
        $unset: { errorSummary: 1 },
      },
    );

    return {
      success: true,
      runId: String(run._id),
      ...counts,
    };
  } catch (error) {
    const runId = run?._id ? String(run._id) : "unavailable";
    try {
      captureException(new Error("Automation cycle failed"), { tags: { runId } });
    } catch {
      // Monitoring failure must not replace the cycle error.
    }
    if (run?._id) {
      try {
        await AutomationRunModel.updateOne(
          { _id: run._id },
          {
            $set: {
              finishedAt: normalizedNow(clock()),
              status: "failed",
              counts: { ...counts },
              errorSummary: boundedError(error),
            },
          },
        );
      } catch (updateError) {
        try {
          captureException(new Error("Automation run recording failed"), { tags: { runId } });
        } catch {
          // Preserve the original cycle failure.
        }
      }
    }
    throw error;
  }
}
