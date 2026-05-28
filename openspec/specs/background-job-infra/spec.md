## Requirements

### Requirement: Cron routes are guarded by CRON_SECRET
The internal cron endpoints SHALL verify a `CRON_SECRET` environment variable before executing any job logic. Requests without a valid `Authorization: Bearer <CRON_SECRET>` header SHALL be rejected with HTTP 401.

#### Scenario: Valid cron secret
- **WHEN** `POST /api/internal/cron/view-count` or `POST /api/internal/cron/import` is called with `Authorization: Bearer <CRON_SECRET>`
- **THEN** the handler SHALL proceed with job processing and return HTTP 200

#### Scenario: Missing or invalid cron secret
- **WHEN** a cron endpoint is called without a valid `Authorization` header
- **THEN** the handler SHALL return HTTP 401 with `UNAUTHENTICATED` error code

#### Scenario: CRON_SECRET not configured
- **WHEN** `CRON_SECRET` env var is not set
- **THEN** the handler SHALL skip secret verification and allow the request (permissive fallback for local dev)

---

### Requirement: View-count cron route processes pending view-count jobs
`POST /api/internal/cron/view-count` SHALL process pending `view_count_jobs` rows using the service-role Supabase client, atomically claim up to a configurable batch, apply view increments, and return a result summary.

#### Scenario: Pending jobs processed
- **WHEN** the cron runs and `view_count_jobs` has pending rows
- **THEN** each pending job SHALL be claimed atomically, `view_count` on the linked news row SHALL be incremented, and the job marked `completed`

#### Scenario: Empty queue
- **WHEN** no pending `view_count_jobs` rows exist
- **THEN** the handler SHALL return successfully with zero processed count

---

### Requirement: Import cron route runs recover → process → alert in sequence
`POST /api/internal/cron/import` SHALL, in order:
1. Call `recoverStuckImportItems()` — move import items stuck in `processing` for > 5 min to `failed` and record them in `import_dlq_items`.
2. Call `processImportItems(batchSize)` — claim and process up to `IMPORT_WORKER_BATCH_SIZE` (default 5) pending import items.
3. Call `processBatchAlerts()` — send Resend alert emails for all terminal batches where `failure_email_sent_at` is null.

#### Scenario: Stuck recovery runs before processing
- **WHEN** the import cron runs
- **THEN** stuck items SHALL be recovered before new items are processed so they don't block batch completion

#### Scenario: IMPORT_WORKER_BATCH_SIZE controls claim size
- **WHEN** `IMPORT_WORKER_BATCH_SIZE` is set to `10`
- **THEN** each cron invocation SHALL claim at most 10 pending import items

---

### Requirement: pg_cron + pg_net is the production scheduler (no Vercel Cron)
The system SHALL use Supabase **pg_cron** and **pg_net** as the sole production scheduling mechanism. There is no `vercel.json` cron config — pg_cron calls the application's HTTP cron endpoints directly from the database every minute.

Both `cron-view-count` and `cron-import` jobs SHALL be registered via the `20260526200000_setup_pg_cron_jobs.sql` migration.

#### Scenario: Jobs scheduled at correct interval
- **WHEN** both pg_cron jobs are active
- **THEN** `SELECT jobname, schedule FROM cron.job` SHALL show `* * * * *` for both `cron-view-count` and `cron-import`

#### Scenario: pg_net posts to application cron endpoints
- **WHEN** pg_cron fires
- **THEN** `pg_net.http_post()` SHALL call `POST /api/internal/cron/view-count` or `POST /api/internal/cron/import` with `Authorization: Bearer <cron_secret>`

#### Scenario: CRON_SECRET stored in internal_settings
- **WHEN** `internal_settings` has a row with `key = 'cron_secret'`
- **THEN** pg_cron jobs SHALL read it at call time to set the Authorization header

#### Scenario: internal_settings is service-role-only
- **WHEN** anon or authenticated (non-service-role) clients query `internal_settings`
- **THEN** RLS SHALL deny access

---

### Requirement: workers/all.ts provides a combined local development worker
`workers/all.ts` (run via `npm run worker:all`) SHALL start both the view-count polling loop and the import polling loop as concurrent processes in a single Node.js process, suitable for local development without pg_cron.

#### Scenario: Both loops run concurrently
- **WHEN** `npm run worker:all` is started
- **THEN** both the view-count worker and the import worker SHALL begin polling without blocking each other

#### Scenario: Workers use service-role credentials
- **WHEN** either worker loop runs locally
- **THEN** it SHALL use the `SUPABASE_SERVICE_ROLE_KEY` environment variable for Supabase access
