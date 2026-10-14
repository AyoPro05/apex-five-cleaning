import test from "node:test";
import assert from "node:assert/strict";
import { executeChatOpsCommand } from "./chatOpsService.js";

function fixture({ approvedAmount } = {}) {
  const quote = {
    _id: "quote-1",
    reference: "AP12345678",
    status: "new",
    approvedAmount,
  };
  const calls = [];
  const scheduled = [];
  return {
    calls,
    scheduled,
    dependencies: {
      QuoteModel: { async findOne() { return quote; } },
      workflow: {
        async updateQuote(input) {
          calls.push(input);
          return {
            quote: { ...quote, ...input.input },
            responseJob: input.input.status === "converted" ? { _id: "job-1" } : null,
          };
        },
      },
      scheduleBackgroundWork(work) { scheduled.push(work); },
      drainAutomationJobs: async (options) => calls.push(options),
      logger: { error() {} },
    },
  };
}

test("ChatOps quote conversion uses the workflow and schedules durable delivery", async () => {
  const f = fixture();
  const result = await executeChatOpsCommand("quote AP12345678 converted 150", f.dependencies);

  assert.match(result.text, /AP12345678/);
  assert.deepEqual(f.calls[0], { quoteId: "quote-1", input: { status: "converted", approvedAmount: 150 } });
  assert.equal(f.scheduled.length, 1);
  await f.scheduled[0]();
  assert.deepEqual(f.calls[1], { limit: 8 });
});

test("ChatOps requires a valid amount before first quote conversion", async () => {
  const f = fixture();
  const result = await executeChatOpsCommand("quote AP12345678 converted", f.dependencies);

  assert.match(result.text, /amount/i);
  assert.equal(f.calls.length, 0);
  assert.equal(f.scheduled.length, 0);
});

test("ChatOps non-conversion status updates use the shared quote workflow", async () => {
  const f = fixture();
  await executeChatOpsCommand("quote AP12345678 contacted", f.dependencies);

  assert.deepEqual(f.calls, [{ quoteId: "quote-1", input: { status: "contacted" } }]);
  assert.equal(f.scheduled.length, 0);
});