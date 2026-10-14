# Backend Automation and Staff Scalability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make quote responses and scheduled automations durable on Vercel while strengthening the admin-managed staff register and preserving all existing public, payment, and authentication flows.

**Architecture:** Persist every external side effect as a MongoDB outbox job, process jobs through a bounded worker callable both after requests and by an authenticated Vercel cron route, and centralise quote conversion in one idempotent workflow service. Keep staff as an admin-owned business entity, validate it through shared Joi schemas, and expose paginated APIs consumed by focused responsive admin components.

**Tech Stack:** Node.js ESM, Express 4, Mongoose 8, Joi 17, `@vercel/functions`, SendGrid/Nodemailer, React 18, Vite 8, Vitest, Testing Library, Tailwind CSS, Vercel Functions and Cron.

---

## Implementation Boundaries

- Preserve the public quote URL, response shape, image upload limits, CAPTCHA, rate limits, admin cookie authentication, Stripe signature verification, and ChatOps signatures.
- Do not create staff accounts, invitations, or a staff portal.
- Do not send real customer email or mutate production records during automated testing.
- Keep completed automation records for diagnosis, but do not copy full customer payloads into jobs.
- Use one daily cron schedule that is compatible with the current Vercel tier. Immediate outbox draining keeps new quote responses prompt.
- Commit each task independently. Do not combine dependency churn with workflow changes.

## File Map

### New server files

- `server/src/models/AutomationJob.js`: durable outbox schema and indexes.
- `server/src/models/AutomationRun.js`: bounded worker-run heartbeat and aggregate results.
- `server/src/models/IdempotencyRecord.js`: distributed request-idempotency state and TTL.
- `server/src/services/automationQueue.js`: enqueue, claim, complete, fail, retry, and summary operations.
- `server/src/services/automationHandlers.js`: maps job types to email, webhook, event, and record-update actions.
- `server/src/services/automationCycle.js`: discovers due work, purges retained quotes, and drains bounded batches.
- `server/src/services/backgroundWork.js`: Vercel `waitUntil` adapter with a safe local fallback.
- `server/src/services/idempotencyService.js`: request fingerprint and acquire/replay/conflict lifecycle.
- `server/src/services/quoteWorkflowService.js`: quote status transitions and idempotent booking conversion.
- `server/src/routes/automation.js`: bearer-protected cron worker endpoint.
- `server/src/routes/adminAutomation.js`: admin status and manual-retry endpoints.
- `server/src/validation/staffSchemas.js`: Joi staff and shift payload contracts.
- `server/src/**/*.test.js` alongside each new service: Node test-runner coverage.

### New client files

- `client/src/pages/admin/QuoteResponsePanel.jsx`: customer response, internal notes, delivery state, and retry command.
- `client/src/pages/admin/QuoteResponsePanel.test.jsx`: response-panel interaction tests.
- `client/src/pages/admin/StaffOperations.jsx`: staff, shift, and payroll workspace state.
- `client/src/pages/admin/StaffRegistrationForm.jsx`: reusable accessible create/edit form.
- `client/src/pages/admin/StaffRegistrationForm.test.jsx`: validation and save-state tests.
- `client/src/pages/admin/StaffRegister.jsx`: responsive filtered and paginated staff list.
- `client/src/pages/admin/StaffRegister.test.jsx`: list, empty, and pagination tests.

### Modified files

- `server/src/index.js`: route mounting, cold-start database readiness, and removal of dead scheduler bootstrap.
- `server/src/models/Quote.js`: customer-response metadata and idempotency linkage.
- `server/models/Booking.js`: unique sparse quote linkage.
- `server/models/Staff.js`: compound query index.
- `server/src/routes/quotes.js`: durable idempotent submission and job enqueueing.
- `server/src/routes/admin.js`: shared quote workflow, response summary, and validated paginated staff routes.
- `server/src/routes/chat.js`: durable chat-lead notifications/events.
- `server/src/routes/chatops.js` and `server/src/utils/chatOpsService.js`: database guard and shared quote workflow.
- `server/src/routes/payments.js`: durable payment event enqueueing.
- `server/src/utils/emailService.js`: approval-message template and consistent result semantics.
- `server/src/utils/eventBus.js`: awaitable dispatch with stable event IDs.
- `server/src/middleware/dbMiddleware.js`: one reusable connection guard.
- `server/vercel.json`, `server/.env.example`, `.env.example`, `docs/DEPLOYMENT.md`, and `docs/EMAIL.md`: cron and operation configuration.
- `client/src/pages/Quote.jsx` and `client/src/pages/Quote.test.jsx`: accurate confirmation wording.
- `client/src/pages/AdminDashboard.jsx`: focused component integration.
- `server/package.json`, `server/package-lock.json`, `client/package.json`, and `client/package-lock.json`: patched dependencies and Vercel runtime helper.

### Removed after replacements pass

- `server/src/jobs/scheduler.js`: in-process timer implementation.
- `server/src/middleware/idempotency.js`: process-memory idempotency cache.

---

### Task 1: Durable Automation Queue

**Files:**
- Create: `server/src/models/AutomationJob.js`
- Create: `server/src/services/automationQueue.js`
- Test: `server/src/services/automationQueue.test.js`

- [ ] **Step 1: Write failing queue lifecycle tests**

Create tests using a small injected fake model. Cover deduplicated enqueue, reclaiming an expired processing lease, successful completion, retry scheduling, terminal failure, and manual retry.

~~~js
import test from "node:test";
import assert from "node:assert/strict";
import {
  createAutomationQueue,
  retryDelayMs,
} from "./automationQueue.js";

test("enqueue uses a unique dedupe key without replacing completed work", async () => {
  const calls = [];
  const model = {
    findOneAndUpdate(filter, update, options) {
      calls.push({ filter, update, options });
      return { lean: async () => ({ dedupeKey: filter.dedupeKey, status: "pending" }) };
    },
  };
  const queue = createAutomationQueue({ model, now: () => new Date("2026-10-14T08:00:00.000Z") });
  await queue.enqueue({
    type: "quote.client-confirmation",
    dedupeKey: "quote.client-confirmation:quote-1",
    entityType: "Quote",
    entityId: "quote-1",
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.upsert, true);
  assert.deepEqual(calls[0].update.$setOnInsert.status, "pending");
});

test("retry delay grows exponentially and remains bounded", () => {
  assert.equal(retryDelayMs(1, 0), 60_000);
  assert.equal(retryDelayMs(2, 0), 300_000);
  assert.equal(retryDelayMs(20, 0), 21_600_000);
});
~~~

- [ ] **Step 2: Run the queue test and verify the missing-module failure**

Run: `cd server && node --test src/services/automationQueue.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `automationQueue.js`.

- [ ] **Step 3: Add the automation job schema**

Define:

~~~js
const automationJobSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true, index: true },
    dedupeKey: { type: String, required: true, trim: true, unique: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: String, required: true, trim: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5, min: 1, max: 10 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    lockedAt: Date,
    lockExpiresAt: { type: Date, index: true },
    lockedBy: { type: String, trim: true },
    completedAt: Date,
    lastError: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

automationJobSchema.index({ status: 1, nextAttemptAt: 1, lockExpiresAt: 1 });
automationJobSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
~~~

- [ ] **Step 4: Implement the injected queue API**

Export `createAutomationQueue({ model, now, workerId })` with:

- `enqueue(job)` using `$setOnInsert` and `upsert: true`.
- `claimNext()` using one `findOneAndUpdate` that selects due `pending` jobs or `processing` jobs with expired leases, increments attempts, and applies a five-minute lease.
- `complete(jobId)` clearing lock fields and setting `completedAt`.
- `fail(job, error)` returning the job to `pending` with `nextAttemptAt` or setting `failed` after `maxAttempts`.
- `retry(jobId)` resetting only a `failed` job to `pending`.
- `getEntityJobs(entityType, entityId)` and `getStatusSummary()` for admin presentation.

Use `retryDelayMs(attempt, jitter)` with delays of 1 minute, 5 minutes, 30 minutes, 2 hours, and 6 hours, capped at 6 hours. Store only `String(error.message || error).slice(0, 500)`.

- [ ] **Step 5: Run focused tests**

Run: `cd server && node --test src/services/automationQueue.test.js`

Expected: all queue lifecycle tests PASS.

- [ ] **Step 6: Commit**

~~~bash
git add server/src/models/AutomationJob.js server/src/services/automationQueue.js server/src/services/automationQueue.test.js
git commit -m "feat: add durable automation queue"
~~~

---

### Task 2: Automation Handlers and Due-work Cycle

**Files:**
- Create: `server/src/services/automationHandlers.js`
- Create: `server/src/services/automationCycle.js`
- Create: `server/src/models/AutomationRun.js`
- Test: `server/src/services/automationHandlers.test.js`
- Test: `server/src/services/automationCycle.test.js`
- Modify: `server/src/utils/eventBus.js:73-123`
- Modify: `server/src/utils/emailService.js:260-293, 537-569, 621-657, 756-794`

- [ ] **Step 1: Write failing handler contract tests**

Test that a handler throws when an email adapter returns `{ success: false }`, stamps the correct legacy field only after success, treats skipped unconfigured webhooks as completed, and passes a stable event ID to the event dispatcher.

~~~js
test("client confirmation is not marked sent when the adapter reports failure", async () => {
  const updates = [];
  const handlers = createAutomationHandlers({
    QuoteModel: { findById: async () => quote, updateOne: async (...args) => updates.push(args) },
    sendClientConfirmationEmail: async () => ({ success: false, error: "smtp unavailable" }),
  });
  await assert.rejects(
    handlers["quote.client-confirmation"]({ entityId: "quote-1", payload: {} }),
    /smtp unavailable/,
  );
  assert.equal(updates.length, 0);
});
~~~

- [ ] **Step 2: Run tests and verify failure**

Run: `cd server && node --test src/services/automationHandlers.test.js src/services/automationCycle.test.js`

Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Make outbound adapters awaitable**

Change `eventBus.js` to export `dispatchEvent(event, data, { eventId } = {})`. It must await all configured targets, use the provided stable ID in the envelope, return `{ skipped: true }` when disabled, return `{ success: true, targets }` when all targets succeed, and return `{ success: false, error }` when any target fails. Retain `emitEvent` temporarily as a compatibility wrapper until all callers move to the queue.

Make `sendQuoteApprovedEmail` use `initializeEmailProvider()` and `sendWithRetry` just like quote confirmation. Keep every mail function's public return shape as `{ success: boolean, error?: string }`; handlers, not mail adapters, convert unsuccessful results into retryable job errors.

- [ ] **Step 4: Implement typed handlers**

Export `createAutomationHandlers(dependencies)` with handlers for:

- `quote.client-confirmation`
- `quote.admin-notification`
- `quote.approved-response`
- `quote.lead-webhook`
- `quote.spam-alert`
- `chat-lead.hot-webhook`
- `chat-lead.spam-alert`
- `domain.event`
- `quote.stuck-reminder`
- `quote.client-follow-up`
- `quote.payment-reminder`
- `booking.satisfaction-follow-up`
- `ops.daily-digest`

Every entity handler reloads the current entity and exits successfully when the entity no longer qualifies. Email success updates the corresponding timestamp/boolean only after the adapter reports success. The payment handler checks for a succeeded `QuotePayment` before sending. The approval handler uses `payload.responseVersion` and exits when it no longer matches the quote.

- [ ] **Step 5: Implement due-work discovery and bounded draining**

Export:

~~~js
export async function enqueueDueAutomationJobs({ now = new Date(), queue = defaultQueue } = {})
export async function drainAutomationJobs({ limit = 20, concurrency = 4, queue = defaultQueue, handlers = defaultHandlers } = {})
export async function runAutomationCycle(options = {})
~~~

`enqueueDueAutomationJobs` creates deterministic keys:

- `quote.stuck-reminder:<quoteId>` after 24 hours in `new`.
- `quote.client-follow-up:<quoteId>` after 24 hours in `new`.
- `quote.payment-reminder:<quoteId>:<convertedAt ISO>` after 48 hours converted and unpaid.
- `booking.satisfaction-follow-up:<bookingId>:<completedAt ISO>` after 48 hours completed.
- `ops.daily-digest:<YYYY-MM-DD>` once per UTC day.

It also permanently purges soft-deleted quotes older than 30 days. Query at most 50 candidates per type. `drainAutomationJobs` runs no more than the requested limit and no more than four handlers concurrently.

`runAutomationCycle` creates one `AutomationRun` record with `startedAt`, `trigger`, and worker ID, then stores `finishedAt`, status, aggregate counts, and a bounded error summary. Add a TTL index that removes run records after 30 days. Capture unexpected cycle and terminal-job errors through the existing Sentry adapter using IDs and job type only.

- [ ] **Step 6: Run focused tests**

Run: `cd server && node --test src/services/automationHandlers.test.js src/services/automationCycle.test.js`

Expected: PASS, including independent email flags and no stamp on failure.

- [ ] **Step 7: Commit**

~~~bash
git add server/src/models/AutomationRun.js server/src/services/automationHandlers.js server/src/services/automationCycle.js server/src/services/automationHandlers.test.js server/src/services/automationCycle.test.js server/src/utils/eventBus.js server/src/utils/emailService.js
git commit -m "feat: process backend automations durably"
~~~

---

### Task 3: Serverless Worker, Background Lifetime, and Database Readiness

**Files:**
- Create: `server/src/services/backgroundWork.js`
- Create: `server/src/routes/automation.js`
- Test: `server/src/routes/automation.test.js`
- Modify: `server/src/middleware/dbMiddleware.js:3-65`
- Modify: `server/src/index.js:44-49, 107-124, 164-177, 204-298`
- Modify: `server/vercel.json`
- Modify: `server/package.json`
- Modify: `server/package-lock.json`

- [ ] **Step 1: Install the serverless lifetime helper**

Run: `npm install --prefix server @vercel/functions`

Expected: `@vercel/functions` appears in server dependencies and the lockfile changes.

- [ ] **Step 2: Write failing cron-auth and background-adapter tests**

~~~js
test("cron rejects requests when CRON_SECRET is absent", async () => {
  assert.equal(isCronRequestAuthorized({ authorization: "Bearer value" }, ""), false);
});

test("cron uses a constant exact bearer match", async () => {
  assert.equal(
    isCronRequestAuthorized({ authorization: "Bearer secret-value" }, "secret-value"),
    true,
  );
  assert.equal(
    isCronRequestAuthorized({ authorization: "Bearer secret-value-extra" }, "secret-value"),
    false,
  );
});
~~~

- [ ] **Step 3: Run the test and verify failure**

Run: `cd server && node --test src/routes/automation.test.js`

Expected: FAIL because `automation.js` does not exist.

- [ ] **Step 4: Implement the background and cron adapters**

`backgroundWork.js` exports `queueBackgroundWork(work, { onError } = {})`. It immediately creates one handled promise, passes it to Vercel `waitUntil` when `VERCEL=1`, and otherwise schedules the same promise with `setImmediate`. Errors go to `onError` or a bounded console warning; no unhandled rejection is allowed.

`automation.js` exports `isCronRequestAuthorized(headers, secret)` and a GET `/run` route. Return:

- `503` when `CRON_SECRET` is missing.
- `401` for a missing or incorrect bearer value.
- `200` with `{ success, enqueued, completed, retried, failed, purged }` after `runAutomationCycle`.
- `500` with a generic error body after capturing unexpected failures.

- [ ] **Step 5: Make database readiness reusable**

Export `getDatabaseUri` from `dbMiddleware.js` and remove the separate environment precheck in `connectDbMiddleware`. Always call the shared `connectToDatabase` promise and return a generic `503` without leaking connection messages in production.

Mount `connectDbMiddleware` after Stripe's raw body parser but before `handleStripeWebhook`, and before `chatopsRouter`:

~~~js
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  connectDbMiddleware,
  handleStripeWebhook,
);
app.use("/api/chatops", connectDbMiddleware, chatopsRouter);
~~~

Remove the unused local `connectDB` function and the `startScheduler` import. Keep `startServer` for local listening and initial connection warming.

- [ ] **Step 6: Mount and schedule the worker**

Mount `app.use("/api/automation", automationRouter)` behind the normal `/api` database guard. Add:

~~~json
"crons": [
  {
    "path": "/api/automation/run",
    "schedule": "0 8 * * *"
  }
]
~~~

to `server/vercel.json`. The worker itself remains safe to invoke more often later.

- [ ] **Step 7: Run tests and syntax check**

Run: `cd server && node --test src/routes/automation.test.js && npm run build`

Expected: cron tests PASS and `node --check src/index.js` exits 0.

- [ ] **Step 8: Commit**

~~~bash
git add server/src/services/backgroundWork.js server/src/routes/automation.js server/src/routes/automation.test.js server/src/middleware/dbMiddleware.js server/src/index.js server/vercel.json server/package.json server/package-lock.json
git commit -m "feat: add authenticated serverless automation worker"
~~~

---

### Task 4: Database-backed Quote Idempotency

**Files:**
- Create: `server/src/models/IdempotencyRecord.js`
- Create: `server/src/services/idempotencyService.js`
- Test: `server/src/services/idempotencyService.test.js`
- Modify: `server/src/models/Quote.js:11-224`

- [ ] **Step 1: Write failing fingerprint and acquisition tests**

Cover stable fingerprints for reordered object keys, changed-payload conflicts, completed replay, active in-progress response, expired-lease takeover, and duplicate-key acquisition races.

~~~js
test("request fingerprint is stable across object key order", () => {
  assert.equal(
    fingerprintRequest({ lastName: "Five", firstName: "Apex" }, []),
    fingerprintRequest({ firstName: "Apex", lastName: "Five" }, []),
  );
});

test("same key with a different fingerprint is a conflict", async () => {
  const service = createIdempotencyService({
    model: fakeModelWithCompletedRecord({ fingerprint: "original" }),
  });
  const result = await service.acquire({
    scope: "POST:/api/quotes/submit",
    key: "quote-key-123",
    fingerprint: "changed",
  });
  assert.equal(result.kind, "conflict");
});
~~~

- [ ] **Step 2: Run tests and verify failure**

Run: `cd server && node --test src/services/idempotencyService.test.js`

Expected: FAIL because the idempotency service does not exist.

- [ ] **Step 3: Add the idempotency schema**

Fields: `scope`, `key`, `fingerprint`, `status` (`processing` or `completed`), `ownerToken`, `leaseExpiresAt`, `responseStatus`, `responseBody`, `resourceType`, `resourceId`, and `expiresAt`. Add a unique compound index on `{ scope: 1, key: 1 }` and a TTL index on `expiresAt` with `expireAfterSeconds: 0`.

Add a sparse unique `idempotencyRecordId` ObjectId field to `Quote`. This lets a reclaimed request find the quote even if the first invocation stopped between quote persistence and idempotency completion.

- [ ] **Step 4: Implement the service API**

Export:

~~~js
export function fingerprintRequest(normalizedBody, files)
export function createIdempotencyService({ model, QuoteModel, now, randomUUID })
~~~

The created service exposes `acquire`, `attachResource`, `complete`, and `release`. Valid keys are 8-128 characters matching `[A-Za-z0-9_.:-]`. Missing/invalid keys return `{ kind: "disabled" }` to preserve backward compatibility. Matching completed work returns `{ kind: "replay", status, body }`; mismatched fingerprints return `conflict`; an active lease returns `in-progress`; expired work is atomically reclaimed.

Hash uploaded image buffers and include only hash, MIME type, and length in the request fingerprint.

- [ ] **Step 5: Run focused tests**

Run: `cd server && node --test src/services/idempotencyService.test.js`

Expected: all idempotency tests PASS.

- [ ] **Step 6: Commit**

~~~bash
git add server/src/models/IdempotencyRecord.js server/src/services/idempotencyService.js server/src/services/idempotencyService.test.js server/src/models/Quote.js
git commit -m "feat: persist quote request idempotency"
~~~

---

### Task 5: Durable Public Quote and Chat Automation

**Files:**
- Modify: `server/src/routes/quotes.js:1-262`
- Modify: `server/src/routes/chat.js:77-146`
- Test: `server/src/routes/quotes.test.js`
- Test: `server/src/routes/chat.test.js`
- Modify: `client/src/pages/Quote.jsx:505-520`
- Modify: `client/src/pages/Quote.test.jsx`

- [ ] **Step 1: Write failing route-service tests**

Export dependency-injected factories `createSubmitQuoteHandler` and `createChatLeadHandler`. Test:

- A quote persists before a successful response.
- Five deterministic jobs are enqueued independently: customer email, admin email, lead webhook, domain event, and optional spam alert.
- Mail flags remain false at submission time.
- A completed idempotency record replays the original `201` result without saving or enqueueing.
- A changed request with the same key returns `409`.
- An active matching request returns `409` with a retry-safe message.
- The background drain is requested only after durable enqueueing.
- Chat lead webhook/event/spam work is enqueued instead of using `setImmediate`.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `cd server && node --test src/routes/quotes.test.js src/routes/chat.test.js`

Expected: tests FAIL against the current post-response `setImmediate` implementation.

- [ ] **Step 3: Refactor quote submission**

After normalization, upload validation, CAPTCHA, and risk assessment:

1. Calculate the request fingerprint.
2. Acquire idempotency using `X-Idempotency-Key`.
3. Replay, conflict, or ask the client to retry according to the acquisition result.
4. Recover an existing quote linked to a reclaimed idempotency record or create one with `idempotencyRecordId`.
5. Enqueue deterministic jobs using `$setOnInsert`.
6. Attach and complete the idempotency record with the exact `201` response.
7. Return the response.
8. Call `queueBackgroundWork(() => drainAutomationJobs({ limit: 8 }))`.

On an error before a quote exists, release the owned idempotency record. On an error after persistence, leave the lease/resource link recoverable. Remove both uses of the in-memory `idempotency()` middleware.

- [ ] **Step 4: Refactor chat lead side effects**

Replace the chat route's `setImmediate` block with jobs keyed by lead ID:

- `chat-lead.hot-webhook:<leadId>`
- `domain.event:chat-lead.created:<leadId>`
- `chat-lead.spam-alert:<leadId>` when suspicious

Request an immediate bounded drain after the `201` response.

- [ ] **Step 5: Correct public confirmation wording**

Change the successful quote copy to:

~~~jsx
<p className="text-gray-600 mb-2">
  Thank you for your request. Your details are safely recorded and your
  confirmation email should arrive shortly.
</p>
~~~

Add a test that renders the success state after a mocked successful API submission and asserts that the UI contains `should arrive shortly` and does not contain `We've sent`.

- [ ] **Step 6: Run quote, chat, and client tests**

Run: `cd server && node --test src/routes/quotes.test.js src/routes/chat.test.js`

Run: `cd client && npm test -- --run src/pages/Quote.test.jsx`

Expected: all focused tests PASS.

- [ ] **Step 7: Commit**

~~~bash
git add server/src/routes/quotes.js server/src/routes/quotes.test.js server/src/routes/chat.js server/src/routes/chat.test.js client/src/pages/Quote.jsx client/src/pages/Quote.test.jsx
git commit -m "feat: make lead capture automation recoverable"
~~~

---

### Task 6: Idempotent Quote Conversion Workflow

**Files:**
- Create: `server/src/services/quoteWorkflowService.js`
- Test: `server/src/services/quoteWorkflowService.test.js`
- Modify: `server/models/Booking.js:16-27, 155-163`
- Modify: `server/src/models/Quote.js:146-205`
- Modify: `server/src/utils/emailService.js:575-657`
- Modify: `server/src/utils/emailService.test.js`
- Modify: `server/src/utils/chatOpsService.js:14-161`
- Modify: `server/src/routes/admin.js:1-20, 141-189, 522-618`

- [ ] **Step 1: Add failing workflow tests**

Use injected models/queue to assert:

- Converting without a positive amount returns a validation error.
- First conversion creates one draft booking, increments `responseVersion`, and enqueues one approval response.
- Repeating the same conversion repairs links but does not create another booking or email version.
- Changing amount or customer message increments the version and creates one new response job.
- Internal `adminNotes` never appears in the response-job payload.
- A duplicate-key race fetches the existing booking.
- Admin and ChatOps both call the same service.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd server && node --test src/services/quoteWorkflowService.test.js`

Expected: FAIL because the workflow service does not exist.

- [ ] **Step 3: Add conversion state and booking uniqueness**

Add to `Quote`:

~~~js
customerMessage: { type: String, trim: true, maxlength: 1000 },
responseVersion: { type: Number, default: 0, min: 0 },
lastResponseQueuedAt: Date,
~~~

Add `bookingSchema.index({ quoteId: 1 }, { unique: true, sparse: true })`. Before deployment, run the read-only duplicate preflight in Task 12; do not apply the unique index to production if duplicates are reported.

- [ ] **Step 4: Implement the shared workflow**

Export `createQuoteWorkflowService(dependencies)` and `updateQuote({ quoteId, input, actor })`.

- Validate status and a rounded amount between `0.01` and `1,000,000` when converting.
- Trim customer message to at most 1,000 characters and admin notes to at most 5,000.
- Upsert a draft booking with `findOneAndUpdate({ quoteId }, { $setOnInsert, $set }, { upsert: true, new: true })`; only update prices on an existing booking while its status is `draft`.
- Catch booking duplicate-key races and load the winner.
- Increment `responseVersion` only on first conversion, reconversion, changed amount, or changed customer message.
- Enqueue `quote.approved-response:<quoteId>:v<version>` and durable `booking.draft_created` / `quote.converted` domain-event jobs.
- Always repair `linkedBookingId` while converted.
- Return `{ quote, booking, responseJob }`.

- [ ] **Step 5: Update the approval email**

Change `getQuoteApprovedTemplate` and `sendQuoteApprovedEmail` to accept:

~~~js
{
  approvedAmount,
  customerMessage,
}
~~~

Escape the message with the existing `escapeHtml` helper, preserve line breaks safely, display the approved amount in GBP, and keep the account/payment CTA. Add template tests proving HTML in the customer message is escaped and internal notes are absent.

- [ ] **Step 6: Replace duplicate route and ChatOps logic**

Delete both copies of `ensureDraftBookingForQuote`. The admin PATCH route validates its body then calls the workflow service. ChatOps passes the parsed status/amount to the same service and reports structured validation failures without changing the quote.

- [ ] **Step 7: Run focused tests**

Run: `cd server && node --test src/services/quoteWorkflowService.test.js src/utils/emailService.test.js`

Expected: conversion, replay, booking-race, and HTML-escaping tests PASS.

- [ ] **Step 8: Commit**

~~~bash
git add server/src/services/quoteWorkflowService.js server/src/services/quoteWorkflowService.test.js server/models/Booking.js server/src/models/Quote.js server/src/utils/emailService.js server/src/utils/emailService.test.js server/src/utils/chatOpsService.js server/src/routes/admin.js
git commit -m "feat: centralize reliable quote conversion"
~~~

---

### Task 7: Automation Operations and Quote Delivery API

**Files:**
- Create: `server/src/routes/adminAutomation.js`
- Test: `server/src/routes/adminAutomation.test.js`
- Modify: `server/src/routes/admin.js:469-493, 522-618`
- Modify: `server/src/index.js:167-177`

- [ ] **Step 1: Write failing authorization and retry tests**

Test that status and retry routes include the existing `adminCookieCsrfMiddleware`, `authMiddleware`, and `adminMiddleware` chain; only failed jobs can be reset; unknown jobs return `404`; and errors expose no job payload.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd server && node --test src/routes/adminAutomation.test.js`

Expected: FAIL because the admin automation router is missing.

- [ ] **Step 3: Implement admin automation endpoints**

Add:

- `GET /api/admin/automation/status`: counts by status, oldest pending time, and the latest `AutomationRun` heartbeat with aggregate results.
- `POST /api/admin/automation/jobs/:id/retry`: reset one failed job and request an immediate drain.

Both routes use the existing admin auth and CSRF chain. Return only job ID, type, status, attempts, next attempt, timestamps, and bounded error summary.

- [ ] **Step 4: Attach delivery state to quote details**

When loading one quote, query jobs for `entityType=Quote` and the quote ID. Return:

~~~js
delivery: {
  confirmation: latestPublicState,
  adminNotification: latestAdminState,
  approvedResponse: latestApprovalState,
}
~~~

The quote PATCH response returns the same `delivery` summary. Use `queued` as the UI-safe label for both pending and processing jobs.

- [ ] **Step 5: Run focused and security tests**

Run: `cd server && node --test src/routes/adminAutomation.test.js src/routes/securityGuards.test.js`

Expected: all tests PASS, including cross-origin mutation rejection.

- [ ] **Step 6: Commit**

~~~bash
git add server/src/routes/adminAutomation.js server/src/routes/adminAutomation.test.js server/src/routes/admin.js server/src/index.js
git commit -m "feat: expose admin automation recovery controls"
~~~

---

### Task 8: Validated and Paginated Staff Backend

**Files:**
- Create: `server/src/validation/staffSchemas.js`
- Test: `server/src/validation/staffSchemas.test.js`
- Test: `server/src/routes/adminStaff.test.js`
- Modify: `server/src/routes/admin.js:37-129, 868-1080`
- Modify: `server/models/Staff.js:24-108`

- [ ] **Step 1: Write failing schema and route tests**

Test:

- Required first name, last name, and phone.
- Lowercased valid optional email.
- Rejection of unknown role/status/employment values rather than fallback.
- Rejection of negative or non-numeric rates.
- Phone, notes, service-area, availability, and emergency-contact bounds.
- PATCH accepts one valid field and rejects an empty/unknown payload.
- Duplicate email returns `409`.
- GET supports page, limit, search, role, status, and approved sort fields.
- Page size is capped at 100 and returns `pagination`.
- A bounded `/staff/options` lookup searches active staff independently of the visible register page.
- A status-only PATCH succeeds without resending the full record.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd server && node --test src/validation/staffSchemas.test.js src/routes/adminStaff.test.js`

Expected: invalid enum tests fail because the current normalizer silently substitutes defaults.

- [ ] **Step 3: Implement Joi contracts**

Create and export `staffCreateSchema`, `staffUpdateSchema`, `shiftCreateSchema`, `shiftUpdateSchema`, and `validatePayload(schema, body)`.

Use these limits:

- Names 1-60 characters.
- Email 254 characters, optional empty value normalized away.
- Phone 7-30 characters matching digits, spaces, `+`, parentheses, dots, and hyphens.
- Rate 0-10,000 with two-decimal precision.
- Up to 20 unique service areas, each 1-80 characters.
- Up to 14 availability slots with valid day and `HH:MM` times.
- Emergency-contact name 120 and phone 30 characters.
- Notes 1,000 characters.
- `unknown(false)` and `abortEarly(false)`.

Return `{ value }` or `{ errors: { fieldName: message } }`.

- [ ] **Step 4: Replace staff normalisation and bound list queries**

Remove `normalizeStaffPayload` and validate POST/PATCH input before model work. Return `400 { success: false, error: "Please correct the highlighted fields", errors }` for validation and `409` for duplicate email.

For GET:

~~~js
const page = Math.max(1, parseInt(req.query.page, 10) || 1);
const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 20, 100));
const skip = (page - 1) * limit;
~~~

Add role filtering and use `Promise.all([Staff.countDocuments(filter), Staff.find(filter).sort(sort).skip(skip).limit(limit).lean({ virtuals: true })])`. Return `pagination: { total, page, limit, pages }`.

Apply the shift schemas to create/update routes while preserving paid-shift immutability and server-owned pay calculations.

Add `GET /api/admin/staff/options?search=<term>&limit=<1-50>` before `/staff/:id` routes. It returns only `_id`, name, role, hourly rate, and status for active staff, sorted by name. This endpoint powers shift assignment without loading the complete register or depending on its current page.

- [ ] **Step 5: Add the staff query index**

Add `staffSchema.index({ status: 1, role: 1, lastName: 1, firstName: 1 })`.

- [ ] **Step 6: Run focused tests**

Run: `cd server && node --test src/validation/staffSchemas.test.js src/routes/adminStaff.test.js`

Expected: all staff validation and pagination tests PASS.

- [ ] **Step 7: Commit**

~~~bash
git add server/src/validation/staffSchemas.js server/src/validation/staffSchemas.test.js server/src/routes/adminStaff.test.js server/src/routes/admin.js server/models/Staff.js
git commit -m "feat: harden admin staff operations"
~~~

---

### Task 9: Quote Response Admin Experience

**Files:**
- Create: `client/src/pages/admin/QuoteResponsePanel.jsx`
- Test: `client/src/pages/admin/QuoteResponsePanel.test.jsx`
- Modify: `client/src/pages/AdminDashboard.jsx:156-159, 268-294, 698-722, 2843-2942`

- [ ] **Step 1: Write failing component tests**

Test:

- Converted status requires a positive amount.
- Customer message is capped at 1,000 characters.
- Internal notes and customer message are visibly separate.
- The submitted payload contains `customerMessage` but never aliases it to `adminNotes`.
- Pending/processing renders `Queued`, completed renders `Sent`, and failed renders a retry control.
- Retry is disabled while pending.
- Form controls and status updates remain usable at narrow widths.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd client && npm test -- --run src/pages/admin/QuoteResponsePanel.test.jsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Build the focused response panel**

Accept `quote`, `adminNotes`, `onAdminNotesChange`, `onQuoteChange`, `onSubmit`, `onRetry`, and `submitState` props. Keep the component in the repository's existing plain-JavaScript style; do not add PropTypes or another runtime dependency solely for this panel.

Use labeled controls, `min="0.01"`, `step="0.01"`, a customer-message character count, an explicit `Internal only` note label, and status badge colours that are distinguishable by text as well as colour. Use Lucide `Send`, `RotateCcw`, `Clock`, `CheckCircle`, and `AlertCircle` icons with text/tooltips.

- [ ] **Step 4: Integrate without closing away delivery feedback**

Extend `updateQuote` to send `customerMessage`. On success, keep the modal open, replace `selectedQuote` with the API quote, attach returned `delivery`, and show `Saved and queued` or `Sent` according to the response. Add `retryQuoteDelivery(jobId)` calling `POST /api/admin/automation/jobs/:id/retry` then reload the quote detail.

Replace only the current status/amount/notes/action block with `QuoteResponsePanel`. Leave quote images, attribution, spam review, and customer details unchanged.

- [ ] **Step 5: Run component and client regression tests**

Run: `cd client && npm test -- --run src/pages/admin/QuoteResponsePanel.test.jsx src/pages/Quote.test.jsx`

Expected: tests PASS.

- [ ] **Step 6: Commit**

~~~bash
git add client/src/pages/admin/QuoteResponsePanel.jsx client/src/pages/admin/QuoteResponsePanel.test.jsx client/src/pages/AdminDashboard.jsx
git commit -m "feat: add observable quote response workflow"
~~~

---

### Task 10: Scalable Staff Admin Experience

**Files:**
- Create: `client/src/pages/admin/StaffRegistrationForm.jsx`
- Create: `client/src/pages/admin/StaffRegistrationForm.test.jsx`
- Create: `client/src/pages/admin/StaffRegister.jsx`
- Create: `client/src/pages/admin/StaffRegister.test.jsx`
- Create: `client/src/pages/admin/StaffOperations.jsx`
- Modify: `client/src/pages/AdminDashboard.jsx:65-90, 182-199, 442-481, 521-696, 880-885, 1978-2565`

- [ ] **Step 1: Write failing form and list tests**

Test required-field validation, invalid email/rate messaging, disabled save state, successful reset, server field-error mapping, search/role/status query changes, empty state, active/inactive commands, and page navigation.

~~~jsx
it("submits normalized staff details and keeps staff admin-managed", async () => {
  const onSave = vi.fn().mockResolvedValue({});
  render(<StaffRegistrationForm onSave={onSave} initialValue={null} />);
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: " Ada " } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: " Lovelace " } });
  fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: "020 0000 0000" } });
  fireEvent.click(screen.getByRole("button", { name: /add staff/i }));
  await waitFor(() => expect(onSave).toHaveBeenCalled());
  expect(onSave.mock.calls[0][0].firstName).toBe("Ada");
  expect(screen.queryByText(/invite|password|login/i)).toBeNull();
});
~~~

- [ ] **Step 2: Run tests and verify failure**

Run: `cd client && npm test -- --run src/pages/admin/StaffRegistrationForm.test.jsx src/pages/admin/StaffRegister.test.jsx`

Expected: FAIL because the focused components do not exist.

- [ ] **Step 3: Build the registration form**

Keep the approved fields only. Validate before calling `onSave` and show per-field errors under their controls with `aria-describedby`. Preserve server `errors` by field. Use a two-column grid only from `md` upward; mobile controls remain one column. Keep save/cancel controls visible and use `Save` / `Plus` icons.

- [ ] **Step 4: Build the responsive register**

Desktop uses the existing compact table. Below `md`, render staff as un-nested list rows with name/contact, role/type, rate, status, service areas, edit, and activate/deactivate actions. Add text search, role/status selects, and Previous/Next controls driven by the server pagination object. Do not fetch unbounded records.

- [ ] **Step 5: Move staff workspace ownership**

Move staff, shift, payroll state and API calls from `AdminDashboard` into `StaffOperations`. Preserve existing shift/payroll behavior and export. Change status updates to PATCH only `{ status }`. Debounce staff search by 300ms or trigger explicitly through the search command, and reset page to 1 when filters change. Query `/api/admin/staff/options` as the administrator types an assignment search so the shift form is independent of register pagination.

Render:

~~~jsx
{activeTab === "staff" && <StaffOperations />}
~~~

The component owns loading, error, success, form, filter, pagination, shift, and payroll states. Use `role="status"` / `aria-live="polite"` for save confirmation and `role="alert"` for errors.

- [ ] **Step 6: Run component and full client tests**

Run: `cd client && npm test -- --run src/pages/admin/StaffRegistrationForm.test.jsx src/pages/admin/StaffRegister.test.jsx`

Run: `cd client && npm test`

Expected: focused tests and all existing client tests PASS.

- [ ] **Step 7: Commit**

~~~bash
git add client/src/pages/admin/StaffRegistrationForm.jsx client/src/pages/admin/StaffRegistrationForm.test.jsx client/src/pages/admin/StaffRegister.jsx client/src/pages/admin/StaffRegister.test.jsx client/src/pages/admin/StaffOperations.jsx client/src/pages/AdminDashboard.jsx
git commit -m "feat: organize responsive staff operations"
~~~

---

### Task 11: Durable Domain Events, Cleanup, and Documentation

**Files:**
- Modify: `server/src/routes/admin.js:1477-1530`
- Modify: `server/src/routes/payments.js:800-850`
- Modify: other `emitEvent` call sites returned by `rg -n "emitEvent\\(" server`
- Test: `server/src/routes/eventProducers.test.js`
- Delete: `server/src/jobs/scheduler.js`
- Delete: `server/src/middleware/idempotency.js`
- Modify: `server/.env.example:95-105`
- Modify: `.env.example:55-65`
- Modify: `docs/DEPLOYMENT.md`
- Modify: `docs/EMAIL.md`

- [ ] **Step 1: Add regression tests for remaining event producers**

Assert that booking confirmation/completion and successful payment enqueue deterministic `domain.event` jobs and request an immediate drain. Assert that replaying the same source transition does not create a second job.

- [ ] **Step 2: Run event-producer tests and verify failure**

Run: `cd server && node --test src/routes/eventProducers.test.js`

Expected: at least one assertion fails while remaining callers still use non-durable `emitEvent`.

- [ ] **Step 3: Replace remaining event emissions**

Use keys that include source entity and transition version/timestamp:

- `domain.event:booking.confirmed:<bookingId>:<updatedAt ISO>`
- `domain.event:booking.completed:<bookingId>:<completedAt ISO>`
- `domain.event:payment.succeeded:<paymentId>`

Queue background draining after the durable write. Delete `emitEvent` after `rg` reports no callers.

- [ ] **Step 4: Delete replaced process-local infrastructure**

Delete `scheduler.js` and `idempotency.js`. Confirm:

Run: `rg -n "startScheduler|stopScheduler|setInterval\\(runHourly|from .*idempotency" server/src`

Expected: no matches.

- [ ] **Step 5: Document operations**

Replace `SCHEDULER_ENABLED` with:

~~~dotenv
# Required for GET /api/automation/run and Vercel Cron Authorization.
CRON_SECRET=replace-with-at-least-32-random-characters

# Vercel invokes the durable worker daily at 08:00 UTC.
~~~

Document job states, daily recovery, immediate delivery, manual retry, safe secret rotation, and the fact that staff are admin-managed records without login.

- [ ] **Step 6: Run server regression tests**

Run: `cd server && npm test`

Expected: all server tests PASS.

- [ ] **Step 7: Commit**

~~~bash
git add server/src/routes/admin.js server/src/routes/payments.js server/src/routes/eventProducers.test.js server/src/utils/eventBus.js server/.env.example .env.example docs/DEPLOYMENT.md docs/EMAIL.md
git add -u server/src/jobs/scheduler.js server/src/middleware/idempotency.js
git commit -m "refactor: retire process-local automation"
~~~

---

### Task 12: Dependency Patches, Full Verification, and Release Readiness

**Files:**
- Modify: `server/package.json`
- Modify: `server/package-lock.json`
- Modify: `client/package.json`
- Modify: `client/package-lock.json`
- Create: `server/scripts/check-booking-quote-duplicates.js`
- Modify: `docs/DEPLOYMENT.md`

- [ ] **Step 1: Add a read-only booking duplicate preflight**

Create a script that connects using `connectToDatabase`, aggregates non-null `quoteId` values with count greater than one, prints only quote ID and count, sets exit code 1 when duplicates exist, and never writes. Add `"check:booking-links": "node scripts/check-booking-quote-duplicates.js"` to the server scripts.

- [ ] **Step 2: Patch production dependencies**

Run:

~~~bash
npm install --prefix server axios@^1.20.0 nodemailer@^10.0.9
npm install --prefix client axios@^1.20.0 dompurify@^3.4.16
npm audit fix --prefix server
~~~

Review lockfile changes and reject unrelated major framework upgrades. Adapt Nodemailer transport tests only for documented v10 API differences.

- [ ] **Step 3: Run dependency audits**

Run: `npm audit --omit=dev --prefix server`

Run: `npm audit --omit=dev --prefix client`

Expected: zero known production vulnerabilities, or a documented residual advisory with no non-breaking fix.

- [ ] **Step 4: Run the complete automated verification**

Run: `cd server && npm test && npm run build`

Run: `cd client && npm test && npm run build`

Run: `git diff --check`

Expected: both test suites PASS, both builds exit 0, and no whitespace errors.

- [ ] **Step 5: Run database index preflight against the intended deployment database**

Run: `cd server && npm run check:booking-links`

Expected: `No duplicate booking quote links found.` Do not proceed to deploy the unique index if the script exits 1; report the quote IDs for a separate reviewed data repair.

- [ ] **Step 6: Perform local browser QA without production writes**

Start the client and a mocked/local API. Verify at 390x844 and 1440x900:

- Public quote completion says the email should arrive shortly.
- Admin quote response clearly separates customer message and internal notes.
- Converted quote requires an amount.
- Queued, sent, and failed delivery states are understandable without colour.
- Retry has a loading state and cannot double-submit.
- Staff registration is one column on mobile and two columns on desktop.
- Staff search, filters, empty state, pagination, edit, deactivate, shifts, and payroll remain usable.
- No controls overlap the announcement/navbar or chat widget.

Capture screenshots for the quote panel and staff register at both widths.

- [ ] **Step 7: Run an independent code review**

Review the full diff against commit `fe39ac5` for:

- Duplicate delivery or booking races.
- Leaked internal notes or job payloads.
- Missing admin/cron authorization.
- Raw Stripe or ChatOps body regressions.
- Unbounded Mongo queries.
- Production email claims that do not match delivery state.
- Unrelated file churn.

Resolve every concrete finding and rerun affected tests.

- [ ] **Step 8: Commit dependency and verification support**

~~~bash
git add server/package.json server/package-lock.json client/package.json client/package-lock.json server/scripts/check-booking-quote-duplicates.js docs/DEPLOYMENT.md
git commit -m "chore: patch backend production dependencies"
~~~

- [ ] **Step 9: Prepare deployment**

Before pushing:

1. Confirm `CRON_SECRET` exists in the backend Vercel project.
2. Confirm booking duplicate preflight is clean.
3. Confirm the working tree contains only reviewed changes.
4. Push the ordered commits.
5. Wait for frontend and backend deployments.
6. Check `/health`, public homepage, quote page, admin login, and cron `401` without a secret.
7. Inspect logs for index, connection, mail-provider, and worker errors.
8. Invoke one authenticated worker run only after confirming it cannot send against test fixtures or after explicit production approval.

Expected: live public routes remain healthy and no production automation is manually triggered during verification.
