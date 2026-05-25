## Context

The current repo already enforces a consistent application architecture:

`UI -> composable -> /api -> service -> repository -> Supabase`

Admin routes already centralize authorization through `requireAdmin()`, and public article reads are served from server APIs rather than direct frontend Supabase calls. Existing synchronous view counting and planned import automation are both good fits for a background-job layer that sits beside the current HTTP request/response flow rather than replacing it.

Phase 7 should preserve existing CRUD and reading flows while adding:
- a queue-backed write path for article view recording
- adjacent article navigation on detail pages
- an editorial import pipeline with batch tracking
- reliable job processing with retries, DLQ handling, and SMTP alerts

## Goals / Non-Goals

**Goals**
- Introduce BullMQ + Redis as the async processing foundation.
- Make `POST /api/news/:id/view` enqueue-only and return HTTP 202.
- Add `newer` / `older` article navigation to the news detail API and page.
- Add admin bulk import submission, batch/item persistence, progress views, and background scraping.
- Add retry, backoff, DLQ, and SMTP alerting for terminal worker failures.

**Non-Goals**
- No rewrite of existing public list/detail pages outside required detail navigation changes.
- No replacement of existing admin news/category CRUD flows.
- No direct frontend-to-Supabase business data access.
- No real-time websocket dashboard in this phase; dashboard progress can be polling-based.

## Decisions

### 1. Phase 7A uses BullMQ queues with separate worker processes

**Decision**: Introduce BullMQ queues backed by Redis for asynchronous processing, with workers running outside Nitro request handlers.

**Rationale**:
- The current Nitro server is request-oriented, not a natural home for long-lived queue consumers.
- View counting and scraping jobs have different throughput and failure profiles; separate workers keep concerns isolated.
- This preserves the existing HTTP architecture while adding a background-processing lane.

**Queues**
- `view-counter`
- `import-scrape`
- `import-dlq`

---

### 2. View count API becomes enqueue-only with accepted semantics

**Decision**: `POST /api/news/:id/view` validates the UUID, enqueues a `view-counter` job, and returns HTTP 202 with a success envelope immediately.

**Rationale**:
- The public detail page should not wait on database writes for a non-critical side effect.
- Eventual consistency is acceptable for article view counts.
- The current UI can retain its best-effort optimistic increment behavior locally.

**Repository/worker note**:
- The worker may reuse the existing atomic increment RPC or replace it with a direct atomic SQL update wrapped in the repository layer.
- The API contract changes, but the detail-page behavior stays the same from the reader’s perspective.

---

### 3. Detail navigation is derived in the news service, not the page

**Decision**: Extend the news detail API to return adjacent published articles:

```ts
navigation: {
  newer: NewsNavigationDto | null,
  older: NewsNavigationDto | null,
}
```

Selection is based on published articles ordered by `published_at`, with deterministic fallback behavior defined in the repository layer if needed.

**Rationale**:
- Navigation logic belongs with article retrieval, not in the client.
- This keeps the page simple and avoids multiple client-side fetches for neighboring articles.

---

### 4. Import pipeline persists batch and item records separately

**Decision**: Add two new persistence models:
- `import_batches`
- `import_items`

`import_batches` tracks the overall request. `import_items` tracks each URL.

**Rationale**:
- Batch-level and item-level status are different concerns.
- The admin dashboard needs both aggregate progress and per-item failure visibility.
- This structure avoids overloading `news` with import-processing concerns.

**Suggested status model**
- Batch: `pending | processing | completed | completed_with_failures | failed`
- Item: `pending | processing | published | failed`

---

### 5. Admin import submission remains enqueue-only

**Decision**: `POST /api/admin/import/bulk`:
- requires admin
- validates `urls[]` and `categoryId`
- enforces max 100 URLs
- deduplicates request URLs
- creates batch and item records
- enqueues one scrape job per item
- returns HTTP 202 with the new `batchId`

**Rationale**:
- The admin request should not block on remote site fetches or parsing.
- This keeps the new API aligned with the asynchronous processing model introduced for view counting.

---

### 6. Progress dashboard is polling-based and server-aggregated

**Decision**: Add admin pages for batch list/detail that poll server APIs and consume aggregate status counts from services/repositories.

**Rationale**:
- The repo already uses `useFetch` / polling-friendly admin pages.
- Phase 7 does not need websocket complexity.
- Server-side aggregation prevents the frontend from recomputing counts over large item lists.

---

### 7. Scraping worker reuses existing sanitization and news creation boundaries

**Decision**: The scraping worker:
- fetches remote HTML
- extracts article fields
- sanitizes content
- maps extracted data into the existing news domain
- creates published news through service/repository boundaries
- updates import item and batch status

**Rationale**:
- The existing server architecture should stay the source of truth for persistence and DTO mapping.
- Sanitization should reuse the current HTML sanitation approach rather than introducing a parallel content-cleaning path.

---

### 8. Retry and DLQ are explicit product behavior, not just queue defaults

**Decision**:
- main scrape jobs use `attempts: 3`
- backoff uses exponential delay
- terminal failures are recorded in `import_items`
- a DLQ handling path sends SMTP alert emails

**Rationale**:
- Operators need visible failure states in both the DB/dashboard and operational alerts.
- Queue failure alone is not enough for editorial workflows; item status must stay queryable in the app itself.

## Data Model Additions

### `import_batches`

Suggested fields:
- `id`
- `created_by`
- `category_id`
- `source_count`
- `status`
- `created_at`
- `updated_at`

### `import_items`

Suggested fields:
- `id`
- `batch_id`
- `source_url`
- `status`
- `retry_count`
- `last_error`
- `news_id`
- `started_at`
- `finished_at`
- `created_at`
- `updated_at`

## API Surface

### Public
- `POST /api/news/:id/view` -> enqueue and return `202`
- `GET /api/news/:slug` -> include adjacent navigation data

### Admin
- `POST /api/admin/import/bulk`
- `GET /api/admin/import/batches`
- `GET /api/admin/import/batches/:id`

All admin APIs keep `requireAdmin()`.

## Risks / Trade-offs

- **Worker runtime complexity**: BullMQ requires a process model outside standard Nuxt request handlers.
- **Scraping quality**: remote HTML extraction will be the highest-variance part of the phase.
- **Eventual consistency**: view counts and import publishing progress become asynchronous.
- **Slug collisions**: imported content may conflict with existing article slugs and needs deterministic handling.
- **Operational config**: Redis and SMTP become required deployment dependencies for the full phase.

## Phase Breakdown

### Phase 7A. Queue Foundation
- Redis/BullMQ wiring
- `view-counter` queue
- `POST /api/news/:id/view` returns 202
- worker applies increments

### Phase 7B. Adjacent Article Navigation
- repository/service support for newer/older published posts
- detail API returns navigation payload
- detail page renders navigation links

### Phase 7C. Bulk Import and Progress Dashboard
- batch/item schema and repositories
- admin bulk import form + enqueue API
- admin batch list/detail progress views

### Phase 7D. Scraping Reliability and Alerting
- scrape worker
- sanitize + create published news
- retry/backoff
- DLQ handling
- SMTP email alerts
