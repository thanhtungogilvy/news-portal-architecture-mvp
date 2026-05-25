## Why

The current project already supports public reading, admin CRUD, rich content editing, image upload, newsletter capture, layered server architecture, and synchronous view counting. The next gap is asynchronous processing: high-frequency view writes should not block user requests, and editorial import workflows should not require manual copy-paste article creation.

Phase 7 introduces background-job infrastructure and editorial import automation without rewriting the existing public or admin flows.

## What Changes

- **Phase 7A. Async view counter queue**: convert `POST /api/news/:id/view` from synchronous RPC increment into a Postgres-backed job-record endpoint; return HTTP 202 immediately after inserting a pending `view_count_jobs` row and process increments in a polling worker.
- **Phase 7B. News detail adjacent navigation**: extend the detail API and page to expose and render `Newer Post` and `Older Post` links for published articles.
- **Phase 7C. Admin bulk import and progress dashboard**: add a new admin bulk-import form with textarea URLs, category selection, import batch/item persistence, async job-creation import API, and progress views for batch status.
- **Phase 7D. Scraping reliability and alerting**: add scraping workers that fetch external URLs, sanitize extracted content, create published news, retry failed jobs up to 3 times with exponential backoff, move terminal failures into `import_dlq_items`, and send Resend alerts.
- **Phase 7E. Crawl listing page**: add a `POST /api/admin/import/crawl` endpoint that accepts a listing-page URL, auto-discovers article links via HTML selector heuristics, and creates an import batch from the discovered URLs — no manual copy-paste required.
- **Phase 7F. Import deduplication and auto-refresh**: add two-layer deduplication (by `source_url` and by generated slug) to prevent duplicate articles; add auto-polling to the import dashboard so batch status and item counts update in real time without manual refresh.

## Capabilities

### New Capabilities

- `admin-import-pipeline`: Admins can submit up to 100 source URLs as an import batch, assign a target category, create pending scraping jobs, and track batch/item progress.
- `admin-import-crawl`: Admins can paste a listing-page URL to auto-discover and enqueue article links without manually collecting URLs.
- `background-job-reliability`: Background jobs support retries, exponential backoff, DLQ table handling, and Resend alerting for terminal failures.
- `import-deduplication`: Import worker checks both `source_url` (already imported) and generated slug (existing news) before creating new articles, preventing duplicates across batches.
- `import-dashboard-live`: Batch list and batch detail admin pages auto-refresh every 5 seconds while jobs are active, giving editors real-time progress without page reload.

### Modified Capabilities

- `view-count-api`: View recording becomes asynchronous and accepted for background processing instead of completed inline.
- `news-detail-page`: Detail pages expose adjacent post navigation while keeping the existing view-recording behavior best-effort.

## Impact

- New Postgres-backed async job tables and polling worker processes
- New admin routes and UI pages under `/admin/import`
- New persistence for import batches/items
- New persistence for DLQ items and async view-count jobs
- Modified `POST /api/news/:id/view` semantics from sync-200 to async-202
- Modified news detail API payload to include adjacent article navigation
- New Resend runtime configuration for DLQ alerts
- New `POST /api/admin/import/crawl` endpoint and UI tab for listing-page discovery
- New two-layer import deduplication (source URL + slug) in the import worker
- Auto-refresh polling (5 s) in admin import composables for live dashboard updates
- No removal of existing public pages, admin CRUD, editor, upload, or newsletter flows
