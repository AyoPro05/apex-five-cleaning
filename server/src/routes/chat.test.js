import test from "node:test";
import assert from "node:assert/strict";
import { createChatLeadHandler } from "./chat.js";

function fixture({ spam = false, failJob } = {}) {
  const events = [];
  const jobs = [];
  const background = [];
  const handler = createChatLeadHandler({
    ChatLeadModel: { create: async (data) => { events.push("save"); return { _id: "lead-1", ...data }; } },
    assessSubmissionRisk: async () => ({ suspectedSpam: spam, suspicionReasons: spam ? ["risk"] : [] }),
    queue: { enqueue: async (job) => { jobs.push(job); events.push("enqueue"); if (job.type === failJob) throw new Error("unavailable"); } },
    queueBackgroundWork: (fn) => { background.push(fn); events.push("background"); },
    drainAutomationJobs: async (options) => { events.push(`drain:${options.limit}`); },
    logger: { error() {} },
  });
  const req = { body: { name: "Apex Five", email: "APEX@example.com", postcode: "me11 2by" }, get: () => "test-agent" };
  const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; events.push(`response:${this.statusCode}`); return this; } };
  return { handler, req, res, events, jobs, background };
}

test("chat lead persists and enqueues deterministic webhook/event/spam jobs before 201", async () => {
  const f = fixture({ spam: true });
  await f.handler(f.req, f.res);
  assert.equal(f.res.statusCode, 201);
  assert.deepEqual(f.jobs.map((job) => job.dedupeKey), ["chat-lead.hot-webhook:lead-1", "domain.event:chat-lead.created:lead-1", "chat-lead.spam-alert:lead-1"]);
  assert.ok(f.jobs.every((job) => job.entityId === "lead-1"));
  assert.ok(f.events.lastIndexOf("enqueue") < f.events.indexOf("response:201"));
  assert.ok(f.events.indexOf("response:201") < f.events.indexOf("background"));
  await f.background[0]();
  assert.ok(f.events.includes("drain:8"));
});

test("chat lead excludes spam job for ordinary submissions", async () => {
  const f = fixture();
  await f.handler(f.req, f.res);
  assert.equal(f.jobs.length, 2);
});

test("chat enqueue failures attempt independent jobs and do not claim success", async () => {
  const f = fixture({ spam: true, failJob: "chat-lead.hot-webhook" });
  await f.handler(f.req, f.res);
  assert.equal(f.res.statusCode, 500);
  assert.equal(f.jobs.length, 3);
  assert.equal(f.background.length, 0);
});

test("invalid chat contact is rejected before persistence", async () => {
  const f = fixture();
  f.req.body = { name: "Apex" };
  await f.handler(f.req, f.res);
  assert.equal(f.res.statusCode, 400);
  assert.deepEqual(f.events, ["response:400"]);
});
