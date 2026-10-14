import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createAutomationRunHandler, isCronRequestAuthorized } from "./automation.js";
import { createBackgroundWork } from "../services/backgroundWork.js";

const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test("cron accepts only an exact configured bearer secret", () => {
  for (const [authorization, secret, expected] of [
    ["Bearer secret", "secret", true], ["Bearer secret-extra", "secret", false],
    [undefined, "secret", false], ["Bearer secret", "", false],
    [["Bearer secret"], "secret", false], ["bearer secret", "secret", false],
  ]) assert.equal(isCronRequestAuthorized({ authorization }, secret), expected);
});

test("cron does no work when unauthorized or unconfigured", async () => {
  for (const [secret, code] of [["", 503], ["configured", 401]]) {
    const handler = createAutomationRunHandler({ secret: () => secret, runCycle: async () => assert.fail("unauthorized work") });
    const res = response();
    await handler({ headers: {} }, res);
    assert.equal(res.code, code);
  }
});

test("cron returns aggregate results and hides unexpected error details", async () => {
  const result = { success: true, enqueued: 2, completed: 1, retried: 1, failed: 0, purged: 0 };
  const res = response();
  await createAutomationRunHandler({ secret: () => "secret", runCycle: async (options) => { assert.equal(options.trigger, "cron"); return result; } })({ headers: { authorization: "Bearer secret" } }, res);
  assert.deepEqual(res.body, result);
  const failureRes = response();
  const captured = [];
  await createAutomationRunHandler({ secret: () => "secret", runCycle: async () => { throw new Error("private@example.com"); }, captureException: (...args) => captured.push(args) })({ headers: { authorization: "Bearer secret" } }, failureRes);
  assert.equal(failureRes.code, 500);
  assert.doesNotMatch(JSON.stringify(failureRes.body), /private/);
  assert.doesNotMatch(captured[0][0].message, /private/);
});

test("hosted background work passes one handled promise to waitUntil", async () => {
  const registered = [];
  let calls = 0;
  const background = createBackgroundWork({ isVercel: () => true, waitUntil: (work) => registered.push(work) });
  const task = background(async () => { calls += 1; });
  assert.equal(registered[0], task);
  await task;
  assert.equal(calls, 1);
});

test("local background work schedules once and handles work and observer errors", async () => {
  const callbacks = [];
  const captured = [];
  const background = createBackgroundWork({ isVercel: () => false, schedule: (fn) => callbacks.push(fn) });
  const task = background(async () => { throw new Error("mail failed"); }, { onError: (error) => { captured.push(error); throw new Error("observer failed"); } });
  assert.equal(callbacks.length, 1);
  assert.equal(captured.length, 0);
  callbacks[0]();
  await task;
  assert.equal(captured.length, 1);
});

test("raw Stripe and ChatOps requests wait for database readiness before handlers", async () => {
  const source = await readFile(new URL("../index.js", import.meta.url), "utf8");
  assert.match(source, /express\.raw\([\s\S]*?connectDbMiddleware,\s*handleStripeWebhook/);
  assert.match(source, /app\.use\("\/api\/chatops", connectDbMiddleware, chatopsRouter\)/);
  assert.doesNotMatch(source, /const connectDB|startScheduler/);
});
