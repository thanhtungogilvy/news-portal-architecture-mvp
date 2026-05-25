## 1. Phase 7A. Queue Foundation

- [x] 1.1 Add schema/migrations for `view_count_jobs` and the minimal status/attempt/error/timestamp fields needed for async processing
- [x] 1.2 Create a worker entrypoint/process structure outside request handlers for polling and consuming pending job rows
- [x] 1.3 Update `POST /api/news/:id/view` to validate UUID, create a pending view-count job row, and return HTTP 202
- [x] 1.4 Add service/repository worker paths to atomically claim pending jobs and apply queued view increments using the existing atomic increment strategy
- [x] 1.5 Verify the public news detail page still records views best-effort without blocking rendering

## 2. Phase 7B. Adjacent Article Navigation

- [x] 2.1 Extend the news repository with adjacent published-article lookup for `newer` and `older` navigation
- [x] 2.2 Extend the news service/detail API to include navigation payload with minimal article metadata
- [x] 2.3 Update the news detail composable/types/page to render `Newer Post` and `Older Post` links
- [x] 2.4 Verify navigation behavior for first article, last article, and middle article scenarios

## 3. Phase 7C. Bulk Import and Progress Dashboard

- [ ] 3.1 Add schema/migrations for `import_batches`, `import_items`, and `import_batches.failure_email_sent_at`, including status, timestamps, retry metadata, and item-to-news linkage
- [ ] 3.2 Add repositories and services for batch creation, item creation, batch aggregation, and item listing
- [ ] 3.3 Add `POST /api/admin/import/bulk` with `requireAdmin`, URL/category validation, max-100 enforcement, batch/item creation, pending-job creation behavior, and HTTP 202 response
- [ ] 3.4 Add admin composables and pages for bulk import submission with textarea URLs and category dropdown
- [ ] 3.5 Add admin batch list/detail progress dashboard showing Pending, Processing, Published, and Failed counts/status
- [ ] 3.6 Verify no direct frontend Supabase business-data calls are introduced in the import flows

## 4. Phase 7D. Scraping Reliability and Alerting

- [ ] 4.1 Add schema/migrations for `import_dlq_items` to persist terminal failures
- [ ] 4.2 Add scraping worker logic to poll pending `import_items`, fetch remote URLs, extract article data, sanitize content, and create published news through existing service/repository boundaries
- [ ] 4.3 Update import item and batch status transitions for pending, processing, published, failed, completed, and completed-with-failures paths
- [ ] 4.4 Configure retry max = 3 with exponential backoff scheduling in persisted job state
- [ ] 4.5 Add explicit DLQ-table handling for terminal failures and persist failure details to `import_dlq_items`
- [ ] 4.6 Add Resend alert service using `RESEND_API_KEY`, `RESEND_FROM`, and `ADMIN_EMAIL`
- [ ] 4.7 Send one consolidated failure email per batch and persist `failure_email_sent_at` to avoid duplicate alerts
- [ ] 4.8 Verify successful scrape publishing, retry behavior, terminal failure behavior, and alert emission paths

## 5. Quality Gates

- [ ] 5.1 Add or update specs/tests for async view counting, adjacent navigation, import batch APIs, worker polling/claiming behavior, and Resend alert idempotency
- [ ] 5.2 Run `npm run typecheck`
- [ ] 5.3 Run `npm run lint`
- [ ] 5.4 Manual: verify detail page still loads normally while view requests return 202
- [ ] 5.5 Manual: verify admin can submit an import batch, see progress changes, and inspect failures
