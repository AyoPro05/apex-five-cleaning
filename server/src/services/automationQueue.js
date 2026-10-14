import { randomUUID } from "node:crypto";

import AutomationJob from "../models/AutomationJob.js";

const MINUTE_MS = 60_000;
const LEASE_MS = 5 * MINUTE_MS;
const MAX_RETRY_DELAY_MS = 6 * 60 * MINUTE_MS;
const RETRY_DELAYS_MS = [
  MINUTE_MS,
  5 * MINUTE_MS,
  30 * MINUTE_MS,
  2 * 60 * MINUTE_MS,
  MAX_RETRY_DELAY_MS,
];
const RETRY_JITTER_RATIO = 0.2;

const JOB_PRESENTATION_FIELDS = {
  type: 1,
  status: 1,
  attempts: 1,
  maxAttempts: 1,
  nextAttemptAt: 1,
  lockedAt: 1,
  lockExpiresAt: 1,
  completedAt: 1,
  lastError: 1,
  createdAt: 1,
  updatedAt: 1,
};

function createWorkerId() {
  const region = process.env.VERCEL_REGION || "local";
  return `${region}:${process.pid}:${randomUUID()}`;
}

export function retryDelayMs(attempt, jitter = Math.random()) {
  const normalizedAttempt = Math.max(1, Math.trunc(Number(attempt) || 1));
  const baseDelay = RETRY_DELAYS_MS[
    Math.min(normalizedAttempt - 1, RETRY_DELAYS_MS.length - 1)
  ];
  const numericJitter = Number(jitter);
  const boundedJitter = Number.isFinite(numericJitter)
    ? Math.min(1, Math.max(0, numericJitter))
    : 0;
  const jitterMs = Math.floor(baseDelay * RETRY_JITTER_RATIO * boundedJitter);

  return Math.min(baseDelay + jitterMs, MAX_RETRY_DELAY_MS);
}

export function createAutomationQueue({
  model = AutomationJob,
  now = () => new Date(),
  workerId = createWorkerId(),
  createLeaseToken = randomUUID,
} = {}) {
  const owner = String(workerId).trim() || createWorkerId();
  const currentTime = () => new Date(now());
  let readinessPromise;

  function ensureReady() {
    if (!readinessPromise) {
      readinessPromise =
        typeof model.init === "function"
          ? Promise.resolve(model.init())
          : Promise.resolve();
    }
    return readinessPromise;
  }

  function findOneAndUpdate(filter, update, options = {}) {
    return model
      .findOneAndUpdate(filter, update, {
        new: true,
        runValidators: true,
        ...options,
      })
      .lean();
  }

  async function enqueue(job) {
    await ensureReady();
    const timestamp = currentTime();
    const document = {
      type: job.type,
      dedupeKey: job.dedupeKey,
      entityType: job.entityType,
      entityId: job.entityId,
      payload: job.payload ?? {},
      status: "pending",
      attempts: 0,
      maxAttempts: job.maxAttempts ?? 5,
      nextAttemptAt: job.nextAttemptAt ?? timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return findOneAndUpdate(
      { dedupeKey: job.dedupeKey },
      { $setOnInsert: document },
      { upsert: true, setDefaultsOnInsert: true, timestamps: false },
    );
  }

  async function claimNext() {
    const timestamp = currentTime();

    await model.updateMany(
      {
        status: "processing",
        lockExpiresAt: { $lte: timestamp },
        $expr: { $gte: ["$attempts", "$maxAttempts"] },
      },
      {
        $set: {
          status: "failed",
          lastError: "Lease expired after maximum attempts",
        },
        $unset: {
          lockedAt: 1,
          lockExpiresAt: 1,
          lockedBy: 1,
          leaseToken: 1,
          nextAttemptAt: 1,
          completedAt: 1,
        },
      },
    );

    return findOneAndUpdate(
      {
        $or: [
          {
            status: "pending",
            nextAttemptAt: { $lte: timestamp },
            $expr: { $lt: ["$attempts", "$maxAttempts"] },
          },
          {
            status: "processing",
            lockExpiresAt: { $lte: timestamp },
            $expr: { $lt: ["$attempts", "$maxAttempts"] },
          },
        ],
      },
      {
        $set: {
          status: "processing",
          lockedAt: timestamp,
          lockExpiresAt: new Date(timestamp.getTime() + LEASE_MS),
          lockedBy: owner,
          leaseToken: createLeaseToken(),
        },
        $inc: { attempts: 1 },
      },
      { sort: { nextAttemptAt: 1, createdAt: 1 } },
    );
  }

  async function complete(job) {
    if (
      !job?._id ||
      !Number.isInteger(job.attempts) ||
      job.attempts < 1 ||
      typeof job.leaseToken !== "string" ||
      !job.leaseToken
    ) {
      throw new TypeError(
        "complete requires a claimed job with an attempt number and lease token",
      );
    }
    const timestamp = currentTime();

    return findOneAndUpdate(
      {
        _id: job._id,
        status: "processing",
        attempts: job.attempts,
        lockedBy: owner,
        leaseToken: job.leaseToken,
      },
      {
        $set: { status: "completed", completedAt: timestamp },
        $unset: {
          lockedAt: 1,
          lockExpiresAt: 1,
          lockedBy: 1,
          leaseToken: 1,
          nextAttemptAt: 1,
          lastError: 1,
        },
      },
    );
  }

  async function fail(job, error) {
    if (
      !job?._id ||
      !Number.isInteger(job.attempts) ||
      job.attempts < 1 ||
      typeof job.leaseToken !== "string" ||
      !job.leaseToken
    ) {
      throw new TypeError(
        "fail requires a claimed job with an attempt number and lease token",
      );
    }
    const timestamp = currentTime();
    const attempts = Math.max(0, Number(job.attempts) || 0);
    const maxAttempts = Math.max(1, Number(job.maxAttempts) || 5);
    const lastError = String(error?.message || error).slice(0, 500);
    const filter = {
      _id: job._id,
      status: "processing",
      attempts,
      lockedBy: owner,
      leaseToken: job.leaseToken,
    };

    if (attempts >= maxAttempts) {
      return findOneAndUpdate(
        filter,
        {
          $set: { status: "failed", lastError },
          $unset: {
            lockedAt: 1,
            lockExpiresAt: 1,
            lockedBy: 1,
            leaseToken: 1,
            nextAttemptAt: 1,
            completedAt: 1,
          },
        },
      );
    }

    return findOneAndUpdate(
      filter,
      {
        $set: {
          status: "pending",
          nextAttemptAt: new Date(
            timestamp.getTime() + retryDelayMs(attempts),
          ),
          lastError,
        },
        $unset: {
          lockedAt: 1,
          lockExpiresAt: 1,
          lockedBy: 1,
          leaseToken: 1,
          completedAt: 1,
        },
      },
    );
  }

  async function retry(jobId) {
    const timestamp = currentTime();

    return findOneAndUpdate(
      { _id: jobId, status: "failed" },
      {
        $set: {
          status: "pending",
          attempts: 0,
          nextAttemptAt: timestamp,
        },
        $unset: {
          lockedAt: 1,
          lockExpiresAt: 1,
          lockedBy: 1,
          leaseToken: 1,
          completedAt: 1,
          lastError: 1,
        },
      },
    );
  }

  async function getEntityJobs(entityType, entityId) {
    return model
      .find({ entityType, entityId }, JOB_PRESENTATION_FIELDS)
      .sort({ createdAt: -1 })
      .lean();
  }

  async function getStatusSummary() {
    const rows = await model.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          oldestCreatedAt: { $min: "$createdAt" },
        },
      },
    ]);
    const counts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
    let oldestPendingAt = null;

    for (const row of rows) {
      if (Object.hasOwn(counts, row._id)) {
        counts[row._id] = row.count;
      }
      if (row._id === "pending") {
        oldestPendingAt = row.oldestCreatedAt ?? null;
      }
    }

    return { counts, oldestPendingAt };
  }

  return {
    enqueue,
    claimNext,
    complete,
    fail,
    retry,
    getEntityJobs,
    getStatusSummary,
  };
}

export const defaultQueue = createAutomationQueue();

export default defaultQueue;
