import test from "node:test";
import assert from "node:assert/strict";
import adminRouter, {
  createAutomationRetryHandler,
  createQuoteDetailHandler,
  createQuoteUpdateHandler,
} from "./admin.js";
import {
  adminCookieCsrfMiddleware,
  authMiddleware,
  adminMiddleware,
} from "../../middleware/auth.js";

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("admin quote update uses the durable workflow and schedules delivery", async () => {
  const calls = [];
  const jobs = [{ _id: "job-1", type: "quote.approved-response", status: "pending", attempts: 0 }];
  const scheduled = [];
  const res = response();
  const handler = createQuoteUpdateHandler({
    workflow: {
      async updateQuote(input) {
        calls.push(input);
        return { quote: { _id: "quote-1", status: "converted" }, responseJob: jobs[0] };
      },
    },
    queue: { async getEntityJobs() { return jobs; } },
    scheduleBackgroundWork(work) { scheduled.push(work); },
    drainAutomationJobs: async (options) => calls.push(options),
    logger: { error() {} },
  });

  await handler({ params: { id: "quote-1" }, body: { status: "converted", approvedAmount: 125, customerMessage: "Welcome" } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls[0], { quoteId: "quote-1", input: { status: "converted", approvedAmount: 125, customerMessage: "Welcome" } });
  assert.deepEqual(res.body.delivery.approvedResponse, { jobId: "job-1", status: "pending", attempts: 0 });
  assert.equal(scheduled.length, 1);
  await scheduled[0]();
  assert.deepEqual(calls[1], { limit: 8 });
});

test("quote detail exposes payload-free approval delivery state", async () => {
  const handler = createQuoteDetailHandler({
    QuoteModel: { async findOne() { return { _id: "quote-1", status: "converted" }; } },
    queue: { async getEntityJobs() { return [
      { _id: "job-1", type: "quote.approved-response", status: "failed", attempts: 5, lastError: "private provider detail" },
    ]; } },
  });
  const res = response();

  await handler({ params: { id: "quote-1" } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.delivery.approvedResponse, { jobId: "job-1", status: "failed", attempts: 5 });
  assert.doesNotMatch(JSON.stringify(res.body), /private provider detail/);
});

test("admin can retry a failed delivery job and schedules its drain", async () => {
  const calls = [];
  const scheduled = [];
  const handler = createAutomationRetryHandler({
    queue: { async retry(jobId) { calls.push(jobId); return { _id: jobId, status: "pending" }; } },
    scheduleBackgroundWork(work) { scheduled.push(work); },
    drainAutomationJobs: async (options) => calls.push(options),
    logger: { error() {} },
  });
  const res = response();

  await handler({ params: { jobId: "job-1" } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.job, { jobId: "job-1", status: "pending" });
  assert.equal(scheduled.length, 1);
  await scheduled[0]();
  assert.deepEqual(calls, ["job-1", { limit: 8 }]);
});

test("quote update and retry routes remain admin protected", () => {
  for (const [method, path] of [
    ["patch", "/quotes/:id"],
    ["post", "/automation/jobs/:jobId/retry"],
  ]) {
    const route = adminRouter.stack.find((layer) => layer.route?.path === path && layer.route.methods[method])?.route;
    assert.ok(route, `${method.toUpperCase()} ${path} is registered`);
    assert.deepEqual(route.stack.slice(0, 3).map((layer) => layer.handle), [
      adminCookieCsrfMiddleware,
      authMiddleware,
      adminMiddleware,
    ]);
  }
});