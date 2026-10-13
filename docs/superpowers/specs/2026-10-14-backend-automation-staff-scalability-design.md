# Backend Automation and Staff Scalability Design

**Date:** 2026-10-14
**Status:** Approved for implementation planning

## Objective

Make the current backend dependable on Vercel, make quote responses observable and retryable, and make the existing admin-managed staff register reliable enough to grow with the business. The work must preserve the live public quote flow and existing authentication while avoiding production-data mutations during verification.

## Confirmed Product Boundary

Staff remain records managed by an administrator. This phase does not create staff invitations, staff credentials, or a staff portal. The staff record remains a separate business entity with a stable identifier so a future account can be linked without replacing scheduling or payroll data.

## Current Problems

1. The hourly scheduler is implemented with an in-process timer. Its startup function is not reached by the current server bootstrap, and a process timer is not durable in a serverless deployment.
2. Quote confirmation, admin notification, webhook, and event work starts after the HTTP response through `setImmediate`. A serverless function can stop before that work finishes.
3. Quote email flags are marked successful without checking the mail provider result.
4. Quote conversion logic is duplicated between the admin route and ChatOps. A converted quote can be saved even when its draft booking or approval email fails, and later requests do not reliably repair the missing side effect.
5. Public quote idempotency is stored in process memory, so concurrent serverless instances can create duplicate quotes.
6. Staff registration accepts weakly validated input, returns generic server errors for several client mistakes, and returns an unbounded list.
7. Raw webhook and ChatOps routes can receive traffic before the serverless database connection is ready.
8. Production dependency audits report fixable vulnerabilities in HTTP, email, and request-address dependencies.
9. The admin dashboard does not clearly show whether a customer-facing quote response is pending, sent, or failed.

## Chosen Approach

Use a MongoDB-backed automation outbox with a small, secured serverless worker. This keeps the current stack, requires no paid queue service, and provides an interface that can later be moved to a managed queue without changing quote or staff workflows.

A route-only patch was rejected because it would leave scheduled and failed work dependent on one request or process. A managed queue was deferred because it introduces an external service and operating cost that the current volume does not require.

## Architecture

### Automation Jobs

Add an `AutomationJob` model with these responsibilities:

- Identify the job type and related entity.
- Enforce a unique deduplication key.
- Track `pending`, `processing`, `completed`, and `failed` states.
- Track attempts, next eligible attempt, processing lease, completion time, and a bounded error summary.
- Support atomic claims so two worker invocations cannot process the same job concurrently.
- Retain enough completed-job history for operational diagnosis without storing unnecessary copies of customer data.

Initial job types cover:

- Customer quote confirmation.
- Administrator new-quote notification.
- Customer quote approval response.
- Existing stale-quote, client follow-up, payment-reminder, satisfaction, and daily-digest automations.

Job payloads should primarily reference existing records. They must not contain secrets or unnecessary personal-data snapshots.

### Worker and Scheduling

Replace the process timer with a callable `runAutomationCycle` service and a protected cron route. The route will:

1. Establish a database connection.
2. Require an exact bearer match against `CRON_SECRET`.
3. Enqueue records that have become due.
4. Atomically claim a bounded batch of jobs.
5. Process jobs with bounded concurrency.
6. Mark each job completed or schedule an exponential-backoff retry.
7. Return aggregate counts without customer data.

The Vercel schedule will use a daily cadence compatible with the current deployment tier. Immediate quote work will not wait for the daily run. The worker interface remains frequency-independent, allowing a more frequent Vercel schedule or an external queue trigger later.

A failed job stops retrying automatically after a finite attempt limit and becomes visible to administrators. Manual retry resets it to `pending` without creating another job.

### Immediate Background Work

When a public quote is accepted, the API will save the quote and idempotently enqueue customer and administrator notification jobs before returning success. It will then request a best-effort immediate drain using the platform-supported background lifetime mechanism. The durable job remains the source of truth, so a stopped function is recovered by cron or manual retry.

Customer and administrator notifications are independent. One delivery failure cannot mark the other successful or prevent it from running.

### Quote Workflow Service

Move quote status transitions and conversion side effects into a focused service used by both the admin API and ChatOps. The service will:

- Validate allowed transitions and approved amounts.
- Keep internal notes separate from customer-facing messages.
- Create or repair exactly one draft booking for a converted quote.
- Enqueue exactly one approval response for the current approved response version.
- Safely converge if a previous request stopped after only part of the workflow.
- Return a structured result that lets callers distinguish quote, booking, and delivery state.

The approved response accepts an optional customer message with a strict length limit. Email templates escape or safely render this value. Internal admin notes are never included in customer mail.

The admin interface will show delivery status and expose a retry command for failed customer-facing responses. It will not claim that an email was sent until the corresponding automation job is complete.

### Database-backed Request Idempotency

Replace the public quote route's process-memory protection with a MongoDB idempotency record keyed by route and client idempotency key. Store a request fingerprint and the successful response reference with a TTL.

- A repeated matching request returns the original quote result.
- Reuse of the same key with a different payload returns a conflict.
- A unique index resolves concurrent races across serverless instances.
- In-progress records expire safely and can be reclaimed after a bounded lease.

### Staff Management

Keep staff registration entirely inside the authenticated admin area. Introduce shared Joi schemas for staff creation and updates, including:

- Required trimmed first name, last name, and phone.
- Valid optional email with lowercase normalization.
- Explicit role, employment type, and status values.
- Non-negative, bounded hourly rates.
- Bounded service areas, availability, emergency contact, and notes.
- Rejection of unknown or malformed values with field-level `400` responses.

The staff list endpoint will support pagination, text search, status and role filters, and a bounded page size while preserving a predictable response contract for the client. Existing staff are deactivated through status rather than deleted. Duplicate email conflicts remain explicit.

The admin UI will provide clear required fields, inline validation, disabled/loading submission states, successful save feedback, responsive controls, filters, and empty/error states. Staff functionality will be extracted from the oversized dashboard only where doing so gives the feature a clear component and API boundary.

No speculative authentication fields will be added to `Staff`. A future account model can reference `staffId` while this record continues to own employment, scheduling, and payroll information.

### Serverless Database Readiness

Use one reusable connection guard for normal APIs, Stripe's raw-body webhook, and ChatOps. Raw-body signature verification must remain intact. Cold-start requests wait for the shared connection promise instead of returning a transient database-unavailable response solely because startup is still in progress.

### Security and Dependency Maintenance

- Preserve HttpOnly admin cookies, bearer support, CSRF origin checks, rate limits, webhook signature verification, and least-privilege admin routes.
- Protect cron and manual retry routes with both authentication and narrow authorization.
- Avoid logging message bodies, tokens, or customer details.
- Upgrade vulnerable production dependencies to patched compatible versions, accepting a major email-library update only with focused transport tests.
- Remove the obsolete timer bootstrap and other code made unreachable by the new worker.

## Data Flow

### New Quote

1. Validate and normalize request data.
2. Acquire or replay a database idempotency record.
3. Persist the quote.
4. Enqueue two deduplicated notification jobs.
5. Complete the idempotency response record.
6. Return the quote reference.
7. Request an immediate bounded worker drain.
8. Persist each delivery result independently; cron recovers unfinished jobs.

The public success screen says the request was received and that confirmation should arrive shortly. It does not make a false delivery claim.

### Admin Quote Approval

1. Validate status, amount, internal notes, and optional customer message.
2. Run the shared quote workflow service.
3. Upsert the linked draft booking.
4. Persist the converted quote state.
5. Enqueue the versioned approval-response job.
6. Return quote, booking, and delivery-state summaries.
7. Update the dashboard without requiring a full reload.

Replaying the command repairs missing state without duplicating bookings or emails.

### Staff Registration

1. Validate and normalize the admin form on the client.
2. Revalidate the payload on the server.
3. Create the staff record under the authenticated administrator.
4. Return a safe staff projection.
5. Insert or update the row in the current paginated view and show clear feedback.

## Error Handling and Observability

- Mail adapters return a normalized success/failure result; the job processor treats failure as failure.
- Retryable provider or network errors receive exponential backoff with jitter.
- Permanent validation or missing-entity errors fail without repeated delivery attempts.
- Worker leases expire so an interrupted invocation can be recovered.
- Sentry receives unexpected worker and workflow errors with job IDs, not customer content.
- Admin APIs expose pending and failed counts, recent run time, and safe error summaries.
- Route responses use consistent `400`, `401`, `403`, `404`, `409`, `422`, `429`, and `500/503` semantics.

## Testing and Verification

### Server Tests

- Idempotent quote replay, payload conflict, and concurrent-key race.
- Independent customer/admin email outcomes.
- Job claiming, lease recovery, retry delay, attempt limit, and manual reset.
- Quote conversion replay with exactly one booking and one response job.
- Shared behavior through admin and ChatOps entry points.
- Cron authorization and missing-secret behavior.
- Staff create/update validation, duplicate email, filtering, and pagination.
- Database cold-start protection without breaking Stripe raw-body verification.

### Client Tests

- Quote success wording does not assert delivery.
- Quote response form validates amount and customer message.
- Delivery badges and retry states reflect API results.
- Staff form validation and API error mapping.
- Staff filters, pagination, loading, empty, and responsive states.

### Release Checks

- Run server and client tests, production builds, and production dependency audits.
- Exercise public quote and admin workflows locally with mocked mail and isolated data.
- Check admin quote and staff views at mobile and desktop widths.
- Verify cron authorization without running customer automations against production data.
- After deployment approval, run public canary checks and inspect logs before enabling the cron schedule.

## Rollout

1. Deploy additive models, services, route compatibility, and UI status handling.
2. Configure a strong `CRON_SECRET` in the backend deployment.
3. Verify a dry or bounded worker call against non-production fixtures.
4. Enable the daily cron schedule.
5. Monitor failed-job counts and quote conversion results.
6. Remove obsolete scheduler code once the durable worker is verified.

Existing quote email flags remain readable during transition and are updated from completed jobs where compatibility requires them. New indexes are additive and background-safe for the current dataset.

## Non-goals

- Staff login, invitations, permissions, or a staff portal.
- A full customer messaging inbox.
- Replacing MongoDB, Vercel, SendGrid, Nodemailer, Stripe, or the admin authentication model.
- Introducing a paid queue service before traffic requires one.
- Redesigning unrelated public pages or the entire admin dashboard.
- Sending real production customer messages during automated verification.

## Success Criteria

- Every accepted quote has durable, independently tracked customer and admin notification work.
- Failed delivery is visible and retryable; no failed mail is marked sent.
- Quote approval converges on one converted quote, one booking draft, and one versioned customer response.
- Duplicate public submissions with the same idempotency key cannot create duplicate quotes across instances.
- Scheduled automations run from an authenticated serverless entry point rather than a process timer.
- Staff payloads are validated consistently and staff lists remain bounded as records grow.
- Admin users can understand quote-response and staff-save outcomes on desktop and mobile.
- Existing authentication, payments, webhook signatures, public quote capture, and live website routes continue to pass regression tests.
