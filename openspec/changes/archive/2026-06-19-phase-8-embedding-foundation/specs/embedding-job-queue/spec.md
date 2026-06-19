## ADDED Requirements

### Requirement: Embedding jobs are queued for async processing
The system SHALL maintain an `embedding_jobs` table following the `view_count_jobs` pattern. Jobs have status `pending | processing | completed | failed` and support batched claiming via `claim_pending_embedding_jobs(batch_size)` RPC using `FOR UPDATE SKIP LOCKED`.

#### Scenario: Job is enqueued after article save
- **WHEN** an article is created or updated via admin API
- **THEN** a new `embedding_jobs` row with `status = pending` SHALL be inserted for that article's ID

#### Scenario: Job is claimed atomically
- **WHEN** the embedding worker calls `claim_pending_embedding_jobs(10)`
- **THEN** up to 10 pending jobs SHALL be atomically moved to `processing` status with no two workers claiming the same job

---

### Requirement: Embedding worker processes jobs in batches
The embedding background worker SHALL poll `embedding_jobs`, claim pending jobs in configurable batches (default 10), call LM Studio for each article, and mark jobs `completed` or `failed`.

#### Scenario: Successful batch
- **WHEN** worker claims a batch of N pending jobs
- **THEN** for each job it SHALL fetch article, build embedding text, call LM Studio, upsert embedding, and mark job `completed`

#### Scenario: LM Studio unavailable
- **WHEN** LM Studio is unreachable during a job
- **THEN** the job SHALL be marked `failed` with `last_error` set, `attempt_count` incremented, and the worker SHALL continue processing remaining jobs in the batch without crashing

#### Scenario: Job retry after failure
- **WHEN** a failed job is re-enqueued (either by backfill or future retry logic)
- **THEN** the worker SHALL process it again, resetting status to `processing`

---

### Requirement: Admin backfill API enqueues jobs for all published articles
`POST /api/admin/embeddings/backfill` SHALL insert `embedding_jobs` rows for all published articles that do not already have a `completed` or `processing` job, and return HTTP 202 with a count of enqueued jobs.

#### Scenario: Backfill with unprocesed articles
- **WHEN** admin calls `POST /api/admin/embeddings/backfill`
- **THEN** response SHALL be `{ enqueued: N }` with HTTP 202 and N jobs inserted

#### Scenario: Backfill is idempotent
- **WHEN** admin calls `POST /api/admin/embeddings/backfill` twice
- **THEN** second call SHALL not duplicate jobs for articles already `completed` or `processing`
