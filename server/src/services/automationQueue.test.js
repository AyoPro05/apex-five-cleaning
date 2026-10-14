import test from "node:test";
import assert from "node:assert/strict";

import automationQueue, {
  createAutomationQueue,
  retryDelayMs,
} from "./automationQueue.js";

const NOW = new Date("2026-10-14T08:00:00.000Z");

function leanQuery(result) {
  return {
    lean: async () => result,
  };
}

test("the default queue exposes the queue lifecycle API", () => {
  assert.deepEqual(
    Object.keys(automationQueue).sort(),
    [
      "claimNext",
      "complete",
      "enqueue",
      "fail",
      "getEntityJobs",
      "getStatusSummary",
      "retry",
    ],
  );
});

test("enqueue uses a unique dedupe key without replacing completed work", async () => {
  const calls = [];
  const completedJob = {
    dedupeKey: "quote.client-confirmation:quote-1",
    status: "completed",
  };
  const model = {
    findOneAndUpdate(filter, update, options) {
      calls.push({ filter, update, options });
      return leanQuery(completedJob);
    },
  };
  const queue = createAutomationQueue({ model, now: () => NOW });

  const result = await queue.enqueue({
    type: "quote.client-confirmation",
    dedupeKey: "quote.client-confirmation:quote-1",
    entityType: "Quote",
    entityId: "quote-1",
  });

  assert.equal(result, completedJob);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].filter, {
    dedupeKey: "quote.client-confirmation:quote-1",
  });
  assert.equal(calls[0].options.upsert, true);
  assert.equal(calls[0].options.new, true);
  assert.equal(calls[0].options.runValidators, true);
  assert.equal(calls[0].update.$setOnInsert.status, "pending");
  assert.equal(calls[0].update.$setOnInsert.attempts, 0);
  assert.equal(calls[0].update.$setOnInsert.maxAttempts, 5);
  assert.deepEqual(calls[0].update.$setOnInsert.nextAttemptAt, NOW);
  assert.equal(calls[0].update.$set, undefined);
});

test("retry delay grows exponentially and remains bounded", () => {
  assert.equal(retryDelayMs(1, 0), 60_000);
  assert.equal(retryDelayMs(2, 0), 300_000);
  assert.equal(retryDelayMs(3, 0), 1_800_000);
  assert.equal(retryDelayMs(4, 0), 7_200_000);
  assert.equal(retryDelayMs(5, 0), 21_600_000);
  assert.equal(retryDelayMs(20, 0), 21_600_000);
  assert.ok(retryDelayMs(1, 1) > retryDelayMs(1, 0));
  assert.equal(retryDelayMs(20, 1), 21_600_000);
});

test("claimNext atomically reclaims an expired processing lease", async () => {
  const calls = [];
  const claimedJob = { _id: "job-1", status: "processing", attempts: 2 };
  const model = {
    findOneAndUpdate(filter, update, options) {
      calls.push({ filter, update, options });
      return leanQuery(claimedJob);
    },
  };
  const queue = createAutomationQueue({
    model,
    now: () => NOW,
    workerId: "worker-a",
  });

  const result = await queue.claimNext();

  assert.equal(result, claimedJob);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].filter, {
    $or: [
      { status: "pending", nextAttemptAt: { $lte: NOW } },
      { status: "processing", lockExpiresAt: { $lte: NOW } },
    ],
  });
  assert.deepEqual(calls[0].update, {
    $set: {
      status: "processing",
      lockedAt: NOW,
      lockExpiresAt: new Date("2026-10-14T08:05:00.000Z"),
      lockedBy: "worker-a",
    },
    $inc: { attempts: 1 },
  });
  assert.deepEqual(calls[0].options.sort, {
    nextAttemptAt: 1,
    createdAt: 1,
  });
  assert.equal(calls[0].options.new, true);
});

test("complete marks owned processing work completed and clears its lease", async () => {
  const calls = [];
  const completedJob = { _id: "job-1", status: "completed" };
  const model = {
    findOneAndUpdate(filter, update, options) {
      calls.push({ filter, update, options });
      return leanQuery(completedJob);
    },
  };
  const queue = createAutomationQueue({
    model,
    now: () => NOW,
    workerId: "worker-a",
  });

  const result = await queue.complete("job-1");

  assert.equal(result, completedJob);
  assert.deepEqual(calls[0].filter, {
    _id: "job-1",
    status: "processing",
    lockedBy: "worker-a",
  });
  assert.deepEqual(calls[0].update.$set, {
    status: "completed",
    completedAt: NOW,
  });
  assert.deepEqual(calls[0].update.$unset, {
    lockedAt: 1,
    lockExpiresAt: 1,
    lockedBy: 1,
    nextAttemptAt: 1,
    lastError: 1,
  });
  assert.equal(calls[0].options.new, true);
});

test("fail schedules retryable work using the claimed attempt", async () => {
  const calls = [];
  const model = {
    findOneAndUpdate(filter, update, options) {
      calls.push({ filter, update, options });
      return leanQuery({ _id: "job-1", status: "pending" });
    },
  };
  const queue = createAutomationQueue({
    model,
    now: () => NOW,
    workerId: "worker-a",
  });

  await queue.fail(
    { _id: "job-1", attempts: 2, maxAttempts: 5 },
    new Error("provider unavailable"),
  );

  assert.deepEqual(calls[0].filter, {
    _id: "job-1",
    status: "processing",
    attempts: 2,
    lockedBy: "worker-a",
  });
  assert.equal(calls[0].update.$set.status, "pending");
  assert.equal(calls[0].update.$set.lastError, "provider unavailable");
  const nextAttemptAt = calls[0].update.$set.nextAttemptAt.getTime();
  assert.ok(nextAttemptAt >= NOW.getTime() + 300_000);
  assert.ok(nextAttemptAt <= NOW.getTime() + 360_000);
  assert.deepEqual(calls[0].update.$unset, {
    lockedAt: 1,
    lockExpiresAt: 1,
    lockedBy: 1,
    completedAt: 1,
  });
});

test("fail stores at most 500 characters of an error", async () => {
  const calls = [];
  const model = {
    findOneAndUpdate(filter, update, options) {
      calls.push({ filter, update, options });
      return leanQuery({ _id: "job-1", status: "pending" });
    },
  };
  const queue = createAutomationQueue({ model, now: () => NOW });

  await queue.fail(
    { _id: "job-1", attempts: 1, maxAttempts: 5 },
    new Error("x".repeat(600)),
  );

  assert.equal(calls[0].update.$set.lastError, "x".repeat(500));
});

test("fail marks work terminal after the maximum claimed attempt", async () => {
  const calls = [];
  const failedJob = { _id: "job-1", status: "failed", attempts: 5 };
  const model = {
    findOneAndUpdate(filter, update, options) {
      calls.push({ filter, update, options });
      return leanQuery(failedJob);
    },
  };
  const queue = createAutomationQueue({
    model,
    now: () => NOW,
    workerId: "worker-a",
  });

  const result = await queue.fail(
    { _id: "job-1", attempts: 5, maxAttempts: 5 },
    "permanent failure",
  );

  assert.equal(result, failedJob);
  assert.deepEqual(calls[0].update.$set, {
    status: "failed",
    lastError: "permanent failure",
  });
  assert.deepEqual(calls[0].update.$unset, {
    lockedAt: 1,
    lockExpiresAt: 1,
    lockedBy: 1,
    nextAttemptAt: 1,
    completedAt: 1,
  });
});

test("retry resets only failed work for immediate processing", async () => {
  const calls = [];
  const retriedJob = { _id: "job-1", status: "pending", attempts: 0 };
  const model = {
    findOneAndUpdate(filter, update, options) {
      calls.push({ filter, update, options });
      return leanQuery(retriedJob);
    },
  };
  const queue = createAutomationQueue({ model, now: () => NOW });

  const result = await queue.retry("job-1");

  assert.equal(result, retriedJob);
  assert.deepEqual(calls[0].filter, { _id: "job-1", status: "failed" });
  assert.deepEqual(calls[0].update, {
    $set: {
      status: "pending",
      attempts: 0,
      nextAttemptAt: NOW,
    },
    $unset: {
      lockedAt: 1,
      lockExpiresAt: 1,
      lockedBy: 1,
      completedAt: 1,
      lastError: 1,
    },
  });
  assert.equal(calls[0].options.new, true);
});

test("getEntityJobs returns newest jobs with a payload-free projection", async () => {
  const calls = [];
  const jobs = [{ _id: "job-1", type: "quote.client-confirmation" }];
  const model = {
    find(filter, projection) {
      const call = { filter, projection, sort: null };
      calls.push(call);
      return {
        sort(sort) {
          call.sort = sort;
          return this;
        },
        lean: async () => jobs,
      };
    },
  };
  const queue = createAutomationQueue({ model });

  const result = await queue.getEntityJobs("Quote", "quote-1");

  assert.equal(result, jobs);
  assert.deepEqual(calls[0].filter, {
    entityType: "Quote",
    entityId: "quote-1",
  });
  assert.deepEqual(calls[0].sort, { createdAt: -1 });
  assert.equal(calls[0].projection.type, 1);
  assert.equal(calls[0].projection.status, 1);
  assert.equal(calls[0].projection.lastError, 1);
  assert.equal(calls[0].projection.payload, undefined);
  assert.equal(calls[0].projection.dedupeKey, undefined);
});

test("getStatusSummary reports every status and the oldest pending job", async () => {
  const calls = [];
  const oldestPendingAt = new Date("2026-10-13T07:00:00.000Z");
  const model = {
    async aggregate(pipeline) {
      calls.push(pipeline);
      return [
        { _id: "pending", count: 3, oldestCreatedAt: oldestPendingAt },
        { _id: "completed", count: 8, oldestCreatedAt: NOW },
      ];
    },
  };
  const queue = createAutomationQueue({ model });

  const result = await queue.getStatusSummary();

  assert.deepEqual(result, {
    counts: {
      pending: 3,
      processing: 0,
      completed: 8,
      failed: 0,
    },
    oldestPendingAt,
  });
  assert.deepEqual(calls[0], [
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        oldestCreatedAt: { $min: "$createdAt" },
      },
    },
  ]);
});

test("AutomationJob schema defines durable states and queue indexes", async () => {
  const { default: AutomationJob } = await import("../models/AutomationJob.js");
  const { schema } = AutomationJob;

  assert.equal(schema.path("dedupeKey").options.unique, true);
  assert.deepEqual(schema.path("status").enumValues, [
    "pending",
    "processing",
    "completed",
    "failed",
  ]);
  assert.equal(schema.path("maxAttempts").options.max, 10);
  assert.equal(schema.path("lastError").options.maxlength, 500);

  const indexes = schema.indexes().map(([fields]) => fields);
  assert.ok(
    indexes.some(
      (fields) =>
        fields.status === 1 &&
        fields.nextAttemptAt === 1 &&
        fields.lockExpiresAt === 1,
    ),
  );
  assert.ok(
    indexes.some(
      (fields) =>
        fields.entityType === 1 &&
        fields.entityId === 1 &&
        fields.createdAt === -1,
    ),
  );
});
