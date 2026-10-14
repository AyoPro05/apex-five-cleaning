import assert from "node:assert/strict";
import test from "node:test";

import {
  drainAutomationJobs,
  enqueueDueAutomationJobs,
  runAutomationCycle,
} from "./automationCycle.js";

const NOW = new Date("2026-10-14T08:00:00.000Z");

function queryResult(rows, call) {
  return {
    select(fields) {
      call.select = fields;
      return this;
    },
    limit(value) {
      call.limit = value;
      return this;
    },
    async lean() {
      return rows;
    },
  };
}

function createDiscoveryModels({
  stuck = [],
  followUps = [],
  payments = [],
  bookings = [],
  paidQuoteIds = [],
  deletedCount = 0,
} = {}) {
  const quoteFinds = [];
  const bookingFinds = [];
  const quoteUpdates = [];
  const purges = [];
  const paymentChecks = [];
  const paid = new Set(paidQuoteIds.map(String));

  const QuoteModel = {
    find(filter) {
      const call = { filter, select: null, limit: null };
      quoteFinds.push(call);
      let rows = [];
      if (Object.hasOwn(filter, "stuckReminderSentAt")) rows = stuck;
      if (Object.hasOwn(filter, "clientFollowUpSentAt")) rows = followUps;
      if (Object.hasOwn(filter, "paymentReminderSentAt")) rows = payments;
      return queryResult(rows, call);
    },
    async updateOne(...args) {
      quoteUpdates.push(args);
      return { acknowledged: true, modifiedCount: 1 };
    },
    async deleteMany(filter) {
      purges.push(filter);
      return { deletedCount };
    },
    async countDocuments() {
      return 0;
    },
  };

  const BookingModel = {
    find(filter) {
      const call = { filter, select: null, limit: null };
      bookingFinds.push(call);
      return queryResult(bookings, call);
    },
  };

  const QuotePaymentModel = {
    async exists(filter) {
      paymentChecks.push(filter);
      return paid.has(String(filter.quoteId)) ? { _id: "paid" } : null;
    },
    async aggregate() {
      return [];
    },
  };

  const ChatLeadModel = {
    async countDocuments() {
      return 0;
    },
  };

  return {
    QuoteModel,
    BookingModel,
    QuotePaymentModel,
    ChatLeadModel,
    quoteFinds,
    bookingFinds,
    quoteUpdates,
    purges,
    paymentChecks,
  };
}

test("enqueueDueAutomationJobs creates deterministic due keys and caps every query", async () => {
  const convertedAt = new Date("2026-10-10T08:00:00.000Z");
  const completedAt = new Date("2026-10-10T07:00:00.000Z");
  const models = createDiscoveryModels({
    stuck: [{ _id: "quote-1" }],
    followUps: [{ _id: "quote-1" }],
    payments: [{ _id: "quote-2", convertedAt }],
    bookings: [{ _id: "booking-1", completedAt }],
    deletedCount: 2,
  });
  const jobs = [];
  const queue = {
    async enqueue(job) {
      jobs.push(job);
      return { ...job, status: "pending" };
    },
  };

  const result = await enqueueDueAutomationJobs({
    now: NOW,
    queue,
    ...models,
  });

  assert.deepEqual(result, { enqueued: 5, purged: 2 });
  assert.deepEqual(
    jobs.map(({ dedupeKey }) => dedupeKey),
    [
      "quote.stuck-reminder:quote-1",
      "quote.client-follow-up:quote-1",
      `quote.payment-reminder:quote-2:${convertedAt.toISOString()}`,
      `booking.satisfaction-follow-up:booking-1:${completedAt.toISOString()}`,
      "ops.daily-digest:2026-10-14",
    ],
  );
  assert.ok(models.quoteFinds.every(({ limit }) => limit === 50));
  assert.ok(models.bookingFinds.every(({ limit }) => limit === 50));
  assert.equal(models.quoteFinds.length, 3);
  assert.equal(models.bookingFinds.length, 1);
  assert.deepEqual(models.purges, [
    {
      isDeleted: true,
      deletedAt: { $lte: new Date("2026-09-14T08:00:00.000Z") },
    },
  ]);
  const paymentJob = jobs.find(({ type }) => type === "quote.payment-reminder");
  assert.deepEqual(paymentJob.payload, {
    convertedAt: convertedAt.toISOString(),
  });
  const bookingJob = jobs.find(
    ({ type }) => type === "booking.satisfaction-follow-up",
  );
  assert.deepEqual(bookingJob.payload, {
    completedAt: completedAt.toISOString(),
  });
});

test("due discovery excludes paid quotes and stamps them to stop later checks", async () => {
  const convertedAt = new Date("2026-10-10T08:00:00.000Z");
  const models = createDiscoveryModels({
    payments: [{ _id: "quote-1", convertedAt }],
    paidQuoteIds: ["quote-1"],
  });
  const jobs = [];

  await enqueueDueAutomationJobs({
    now: NOW,
    queue: {
      async enqueue(job) {
        jobs.push(job);
        return job;
      },
    },
    ...models,
  });

  assert.equal(
    jobs.some(({ type }) => type === "quote.payment-reminder"),
    false,
  );
  assert.deepEqual(models.paymentChecks, [
    { quoteId: "quote-1", status: "succeeded" },
  ]);
  assert.deepEqual(models.quoteUpdates, [
    [
      {
        _id: "quote-1",
        status: "converted",
        convertedAt,
        paymentReminderSentAt: { $exists: false },
      },
      { $set: { paymentReminderSentAt: NOW } },
    ],
  ]);
});

test("drainAutomationJobs honors its limit and caps concurrency at four", async () => {
  const jobs = Array.from({ length: 8 }, (_, index) => ({
    _id: `job-${index + 1}`,
    type: "work",
    attempts: 1,
    maxAttempts: 5,
    leaseToken: `lease-${index + 1}`,
  }));
  let next = 0;
  let active = 0;
  let maxActive = 0;
  const completed = [];
  const queue = {
    async claimNext() {
      return jobs[next++] ?? null;
    },
    async complete(job) {
      completed.push(job);
      return { ...job, status: "completed" };
    },
    async fail() {
      assert.fail("successful work must not fail");
    },
  };
  const handlers = {
    async work() {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setImmediate(resolve));
      active -= 1;
    },
  };

  const result = await drainAutomationJobs({
    limit: 5,
    concurrency: 20,
    queue,
    handlers,
  });

  assert.deepEqual(result, {
    claimed: 5,
    completed: 5,
    retried: 0,
    failed: 0,
  });
  assert.equal(completed.length, 5);
  assert.equal(maxActive, 4);
  assert.ok(completed.every((job) => job.leaseToken?.startsWith("lease-")));
});

test("drainAutomationJobs durably fails handler errors and unknown job types", async () => {
  const retryJob = {
    _id: "job-retry",
    type: "known",
    attempts: 1,
    maxAttempts: 5,
    leaseToken: "lease-retry",
  };
  const terminalJob = {
    _id: "job-terminal",
    type: "not-registered",
    attempts: 5,
    maxAttempts: 5,
    leaseToken: "lease-terminal",
    payload: { email: "must-not-reach-monitoring@example.com" },
  };
  const pending = [retryJob, terminalJob];
  const failures = [];
  const captured = [];
  const queue = {
    async claimNext() {
      return pending.shift() ?? null;
    },
    async complete() {
      assert.fail("failed jobs must not complete");
    },
    async fail(job, error) {
      failures.push({ job, error });
      return {
        ...job,
        status: job.attempts >= job.maxAttempts ? "failed" : "pending",
      };
    },
  };

  const result = await drainAutomationJobs({
    limit: 2,
    concurrency: 2,
    queue,
    handlers: {
      async known() {
        throw new Error("provider unavailable");
      },
    },
    captureException(error, context) {
      captured.push({ error, context });
    },
  });

  assert.deepEqual(result, {
    claimed: 2,
    completed: 0,
    retried: 1,
    failed: 1,
  });
  assert.equal(failures.length, 2);
  const failuresById = new Map(
    failures.map((failure) => [failure.job._id, failure]),
  );
  assert.equal(failuresById.get("job-retry").job, retryJob);
  assert.equal(failuresById.get("job-terminal").job, terminalJob);
  assert.match(
    failuresById.get("job-terminal").error.message,
    /no automation handler/i,
  );
  assert.equal(captured.length, 1);
  assert.deepEqual(captured[0].context, {
    tags: {
      jobId: "job-terminal",
      jobType: "not-registered",
    },
  });
  assert.doesNotMatch(JSON.stringify(captured[0].context), /must-not-reach/);
});

test("a lost lease is not reported as completed, retried, or failed", async () => {
  const pending = [
    { _id: "stale-success", type: "success", attempts: 1, maxAttempts: 5 },
    { _id: "stale-failure", type: "failure", attempts: 5, maxAttempts: 5 },
  ];
  const captured = [];
  const result = await drainAutomationJobs({
    limit: 2,
    queue: {
      async claimNext() { return pending.shift() ?? null; },
      async complete() { return null; },
      async fail() { return null; },
    },
    handlers: {
      async success() {},
      async failure() { throw new Error("stale attempt failed"); },
    },
    captureException(...args) { captured.push(args); },
  });

  assert.deepEqual(result, { claimed: 2, completed: 0, retried: 0, failed: 0 });
  assert.equal(captured.length, 0);
});

test("draining waits for active handlers before rejecting a queue failure", async () => {
  let releaseHandler;
  const handlerGate = new Promise((resolve) => { releaseHandler = resolve; });
  let peerFinished = false;
  let settled = false;
  const failure = new Error("database unavailable");
  const pending = [{ _id: "job-1", type: "broken" }, { _id: "job-2", type: "slow" }];
  const draining = drainAutomationJobs({
    limit: 2,
    concurrency: 2,
    queue: {
      async claimNext() { return pending.shift() ?? null; },
      async complete(job) { return { ...job, status: "completed" }; },
      async fail() { throw failure; },
    },
    handlers: {
      async broken() { throw new Error("mail failed"); },
      async slow() { await handlerGate; peerFinished = true; },
    },
  });
  const rejection = assert.rejects(draining, failure).then(() => { settled = true; });

  await new Promise((resolve) => setImmediate(resolve));
  const settledEarly = settled;
  releaseHandler();
  await rejection;
  assert.equal(settledEarly, false, "the cycle must remain active while a handler is running");
  assert.equal(peerFinished, true);
});

test("a non-finite drain limit does not create an unbounded worker", async () => {
  let claims = 0;
  const result = await drainAutomationJobs({
    limit: Infinity,
    queue: { async claimNext() { claims += 1; return null; } },
  });
  assert.equal(claims, 0);
  assert.equal(result.claimed, 0);
});

test("terminal job monitoring does not include provider messages or customer data", async () => {
  const captured = [];
  const pending = [{ _id: "job-1", type: "mail", attempts: 5, maxAttempts: 5 }];
  await drainAutomationJobs({
    limit: 1,
    queue: {
      async claimNext() { return pending.shift() ?? null; },
      async fail(job) { return { ...job, status: "failed" }; },
    },
    handlers: { async mail() { throw new Error("Rejected recipient private@example.com"); } },
    captureException(error, context) { captured.push({ message: error.message, stack: error.stack, context }); },
  });
  assert.equal(captured.length, 1);
  assert.doesNotMatch(JSON.stringify(captured), /private@example\.com|Rejected recipient/);
  assert.deepEqual(captured[0].context.tags, { jobId: "job-1", jobType: "mail" });
});

test("runAutomationCycle records one successful run with aggregate counts", async () => {
  const creates = [];
  const updates = [];
  const AutomationRunModel = {
    async create(document) {
      creates.push(document);
      return { _id: "run-1", ...document };
    },
    async updateOne(...args) {
      updates.push(args);
      return { acknowledged: true, modifiedCount: 1 };
    },
  };

  const result = await runAutomationCycle({
    now: NOW,
    trigger: "cron",
    workerId: "worker-1",
    queue: { name: "queue" },
    handlers: { name: "handlers" },
    AutomationRunModel,
    enqueueDue: async () => ({ enqueued: 5, purged: 2 }),
    drain: async () => ({
      claimed: 4,
      completed: 2,
      retried: 1,
      failed: 1,
    }),
  });

  assert.deepEqual(result, {
    success: true,
    runId: "run-1",
    enqueued: 5,
    completed: 2,
    retried: 1,
    failed: 1,
    purged: 2,
  });
  assert.deepEqual(creates, [
    {
      startedAt: NOW,
      trigger: "cron",
      workerId: "worker-1",
      status: "running",
      counts: {
        enqueued: 0,
        completed: 0,
        retried: 0,
        failed: 0,
        purged: 0,
      },
    },
  ]);
  assert.deepEqual(updates, [
    [
      { _id: "run-1" },
      {
        $set: {
          finishedAt: NOW,
          status: "completed",
          counts: {
            enqueued: 5,
            completed: 2,
            retried: 1,
            failed: 1,
            purged: 2,
          },
        },
        $unset: { errorSummary: 1 },
      },
    ],
  ]);
});

test("runAutomationCycle records and captures unexpected failures without payload data", async () => {
  const updates = [];
  const captured = [];
  const AutomationRunModel = {
    async create(document) {
      return { _id: "run-failed", ...document };
    },
    async updateOne(...args) {
      updates.push(args);
      return { acknowledged: true, modifiedCount: 1 };
    },
  };
  const failure = new Error("x".repeat(600));

  await assert.rejects(
    runAutomationCycle({
      now: NOW,
      workerId: "worker-1",
      AutomationRunModel,
      enqueueDue: async () => {
        throw failure;
      },
      captureException(error, context) {
        captured.push({ error, context });
      },
    }),
    failure,
  );

  assert.equal(captured.length, 1);
  assert.equal(captured[0].error.message, "Automation cycle failed");
  assert.deepEqual(captured[0].context, {
    tags: { runId: "run-failed" },
  });
  assert.deepEqual(updates, [
    [
      { _id: "run-failed" },
      {
        $set: {
          finishedAt: NOW,
          status: "failed",
          counts: {
            enqueued: 0,
            completed: 0,
            retried: 0,
            failed: 0,
            purged: 0,
          },
          errorSummary: "x".repeat(500),
        },
      },
    ],
  ]);
});

test("cycle monitoring does not include arbitrary database error details", async () => {
  const captured = [];
  const failure = new Error("Invalid value for private@example.com");
  await assert.rejects(runAutomationCycle({
    AutomationRunModel: { async create() { throw failure; } },
    captureException(error, context) { captured.push({ message: error.message, stack: error.stack, context }); },
  }), failure);
  assert.equal(captured.length, 1);
  assert.doesNotMatch(JSON.stringify(captured), /private@example\.com|Invalid value/);
});

test("AutomationRun expires all runs, including interrupted runs, after 30 days", async () => {
  const { default: AutomationRun } = await import("../models/AutomationRun.js");
  const { schema } = AutomationRun;

  assert.deepEqual(schema.path("status").enumValues, [
    "running",
    "completed",
    "failed",
  ]);
  assert.equal(schema.path("errorSummary").options.maxlength, 500);
  assert.equal(schema.path("counts.enqueued").instance, "Number");

  const ttlIndex = schema
    .indexes()
    .find(([fields, options]) => fields.startedAt === 1 && options.expireAfterSeconds);
  assert.ok(ttlIndex, "interrupted runs need a TTL index on their required startedAt");
  assert.equal(ttlIndex[1].expireAfterSeconds, 30 * 24 * 60 * 60);
});
