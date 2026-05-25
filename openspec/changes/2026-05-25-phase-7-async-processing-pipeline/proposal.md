## Why

The current project already supports public reading, admin CRUD, rich content editing, image upload, newsletter capture, layered server architecture, and synchronous view counting. The next gap is asynchronous processing: high-frequency view writes should not block user requests, and editorial import workflows should not require manual copy-paste article creation.

Phase 7 introduces background-job infrastructure and editorial import automation without rewriting the existing public or admin flows.

## What Changes

- **Phase 7A. Async view counter queue**: convert `POST /api/news/:id/view` from synchronous RPC increment into a BullMQ enqueue endpoint backed by Redis; return HTTP 202 immediately and process increments in a worker.
- **Phase 7B. News detail adjacent navigation**: extend the detail API and page to expose and render `Newer Post` and `Older Post` links for published articles.
- **Phase 7C. Admin bulk import and progress dashboard**: add a new admin bulk-import form with textarea URLs, category selection, import batch/item persistence, enqueue-only import API, and progress views for batch status.
- **Phase 7D. Scraping reliability and alerting**: add scraping workers that fetch external URLs, sanitize extracted content, create published news, retry failed jobs up to 3 times with exponential backoff, move terminal failures through DLQ handling, and send SMTP alerts.

## Capabilities

### New Capabilities

- `admin-import-pipeline`: Admins can submit up to 100 source URLs as an import batch, assign a target category, enqueue scraping work, and track batch/item progress.
- `background-job-reliability`: Background jobs support retries, exponential backoff, DLQ handling, and SMTP alerting for terminal failures.

### Modified Capabilities

- `view-count-api`: View recording becomes asynchronous and accepted for background processing instead of completed inline.
- `news-detail-page`: Detail pages expose adjacent post navigation while keeping the existing view-recording behavior best-effort.

## Impact

- New infrastructure wiring for BullMQ + Redis worker processes
- New admin routes and UI pages under `/admin/import`
- New persistence for import batches/items
- Modified `POST /api/news/:id/view` semantics from sync-200 to async-202
- Modified news detail API payload to include adjacent article navigation
- New SMTP runtime configuration for DLQ alerts
- No removal of existing public pages, admin CRUD, editor, upload, or newsletter flows
