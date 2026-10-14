import test from "node:test";
import assert from "node:assert/strict";
import { createSubmitQuoteHandler } from "./quotes.js";
import { fingerprintRequest } from "../services/idempotencyService.js";

const body = {
  propertyType: "house", bedrooms: "3", bathrooms: "2", serviceType: "residential",
  firstName: "Apex", lastName: "Five", email: "APEX@example.com", phone: "07123 456789",
  address: "1 High Street", postcode: "me11 2by", captchaToken: "captcha-token",
};
function fixture({ acquisition = { kind: "disabled" }, recovered = null, spam = false, saveError, failedJob, attachResult = {} } = {}) {
  const events = [];
  const jobs = [];
  const saved = [];
  const background = [];
  const acquired = [];
  let released = 0;
  let completed;
  class QuoteModel {
    constructor(data) { Object.assign(this, { _id: "quote-1", reference: "AP12345678", confirmationEmailSent: false, adminEmailSent: false }, data); }
    async save() { events.push("save"); if (saveError) throw saveError; saved.push(this); }
    static async findOne() { events.push("recover"); return recovered; }
  }
  const handler = createSubmitQuoteHandler({
    QuoteModel,
    idempotencyService: {
      acquire: async (input) => { acquired.push(input); return acquisition; },
      attachResource: async () => { events.push("attach"); return attachResult; },
      complete: async (input) => { completed = input; events.push("complete"); return {}; },
      release: async () => { released++; },
    },
    assessSubmissionRisk: async () => ({ suspectedSpam: spam, suspicionReasons: spam ? ["risk"] : [] }),
    queue: { enqueue: async (job) => { jobs.push(job); events.push(`enqueue:${job.type}`); if (job.type === failedJob) throw new Error("storage unavailable"); } },
    queueBackgroundWork: (fn) => { background.push(fn); events.push("background"); },
    drainAutomationJobs: async (input) => { events.push(`drain:${input.limit}`); },
    logger: { error() {}, warn() {} },
  });
  const req = { body: { ...body }, files: [], ip: "127.0.0.1", captcha: { score: 0.9, verified: true }, get: () => "quote-key-123" };
  const res = {
    statusCode: 200, headers: {},
    status(code) { this.statusCode = code; return this; },
    setHeader(key, value) { this.headers[key] = value; },
    json(payload) { this.body = payload; events.push(`response:${this.statusCode}`); return this; },
  };
  return { handler, req, res, events, jobs, saved, acquired, background, released: () => released, completed: () => completed };
}
const owned = { kind: "acquired", record: { _id: "record-1" }, ownerToken: "owner-1" };

test("quote persistence and independent deterministic jobs precede 201; delivery flags stay false", async () => {
  const f = fixture({ acquisition: owned, spam: true });
  await f.handler(f.req, f.res);
  assert.equal(f.res.statusCode, 201);
  assert.equal(f.saved.length, 1);
  assert.equal(f.saved[0].idempotencyRecordId, "record-1");
  assert.equal(f.saved[0].confirmationEmailSent, false);
  assert.equal(f.saved[0].adminEmailSent, false);
  assert.equal(f.saved[0].email, "apex@example.com");
  assert.equal(f.saved[0].phone, "+447123456789");
  assert.equal(f.saved[0].postcode, "ME11 2BY");
  assert.deepEqual(f.jobs.map((job) => job.dedupeKey), [
    "quote.client-confirmation:quote-1", "quote.admin-notification:quote-1", "quote.lead-webhook:quote-1",
    "domain.event:quote.created:quote-1", "quote.spam-alert:quote-1",
  ]);
  assert.ok(f.events.indexOf("save") < f.events.indexOf("enqueue:quote.client-confirmation"));
  assert.ok(f.events.indexOf("enqueue:quote.spam-alert") < f.events.indexOf("response:201"));
  assert.deepEqual(f.completed().body, f.res.body);
  assert.equal(f.completed().status, 201);
  assert.ok(f.events.indexOf("response:201") < f.events.indexOf("background"));
  await f.background[0]();
  assert.ok(f.events.includes("drain:8"));
});

test("completed replay does not persist, enqueue or start a drain", async () => {
  const payload = { success: true, quoteId: "old-quote", reference: "AP00000000" };
  const f = fixture({ acquisition: { kind: "replay", status: 201, body: payload } });
  await f.handler(f.req, f.res);
  assert.equal(f.res.statusCode, 201);
  assert.deepEqual(f.res.body, payload);
  assert.equal(f.res.headers["X-Idempotent-Replay"], "true");
  assert.equal(f.saved.length, 0);
  assert.equal(f.jobs.length, 0);
  assert.equal(f.background.length, 0);
});

test("changed payload and active lease return 409 without creating work", async () => {
  for (const kind of ["conflict", "in-progress"]) {
    const f = fixture({ acquisition: { kind } });
    await f.handler(f.req, f.res);
    assert.equal(f.res.statusCode, 409);
    if (kind === "in-progress") assert.match(f.res.body.error, /retry.*same|same.*retry/i);
    assert.equal(f.saved.length, 0);
    assert.equal(f.jobs.length, 0);
  }
});

test("reclaimed lease recovers a quote saved before attachment and repairs queued work", async () => {
  const recovered = { _id: "quote-old", reference: "AP87654321", suspectedSpam: false, idempotencyRecordId: "record-1" };
  const f = fixture({ acquisition: owned, recovered });
  await f.handler(f.req, f.res);
  assert.equal(f.res.statusCode, 201);
  assert.equal(f.res.body.quoteId, "quote-old");
  assert.equal(f.saved.length, 0);
  assert.equal(f.jobs.length, 4);
  assert.ok(f.jobs.every((job) => job.entityId === "quote-old"));
});

test("enqueue failure still attempts every independent job and preserves persisted lease", async () => {
  const f = fixture({ acquisition: owned, spam: true, failedJob: "quote.client-confirmation" });
  await f.handler(f.req, f.res);
  assert.equal(f.res.statusCode, 500);
  assert.equal(f.jobs.length, 5);
  assert.equal(f.released(), 0);
  assert.equal(f.completed(), undefined);
  assert.equal(f.background.length, 0);
});

test("failure before persistence releases the owned lease", async () => {
  const f = fixture({ acquisition: owned, saveError: new Error("save failed") });
  await f.handler(f.req, f.res);
  assert.equal(f.res.statusCode, 500);
  assert.equal(f.released(), 1);
  assert.equal(f.jobs.length, 0);
});

test("lost ownership at attachment returns a retry-safe 409", async () => {
  const f = fixture({ acquisition: owned, attachResult: null });
  await f.handler(f.req, f.res);
  assert.equal(f.res.statusCode, 409);
  assert.match(f.res.body.error, /same/i);
  assert.equal(f.completed(), undefined);
});

test("fingerprint ignores refreshed CAPTCHA and generated image storage filenames", async () => {
  const f = fixture();
  const image = { originalname: "photo.jpg", mimetype: "image/jpeg", buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]) };
  f.req.files = [image];
  await f.handler(f.req, f.res);
  f.req.body.captchaToken = "refreshed-captcha";
  await f.handler(f.req, f.res);
  assert.equal(f.acquired.length, 2);
  assert.equal(f.acquired[0].fingerprint, f.acquired[1].fingerprint);
  assert.notEqual(f.acquired[0].fingerprint, fingerprintRequest({}, []));
});

test("invalid image and invalid quote still return 400 before acquisition", async () => {
  const f = fixture();
  f.req.files = [{ originalname: "file.jpg", buffer: Buffer.from("text"), mimetype: "image/jpeg" }];
  await f.handler(f.req, f.res);
  assert.equal(f.res.statusCode, 400);
  assert.equal(f.acquired.length, 0);
  f.req.files = [];
  f.req.body.email = "invalid";
  await f.handler(f.req, f.res);
  assert.equal(f.res.statusCode, 400);
  assert.equal(f.acquired.length, 0);
});
