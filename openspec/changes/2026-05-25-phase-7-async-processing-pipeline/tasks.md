## 1. Phase 7A. Queue Foundation

- [ ] 1.1 Add BullMQ + Redis runtime configuration and queue bootstrap modules for `view-counter`, `import-scrape`, and `import-dlq`
- [ ] 1.2 Create a worker entrypoint/process structure outside request handlers for background job consumption
- [ ] 1.3 Update `POST /api/news/:id/view` to validate UUID, enqueue a view-count job, and return HTTP 202
- [ ] 1.4 Add service/repository worker paths to apply queued view increments using the existing atomic increment strategy
- [ ] 1.5 Verify the public news detail page still records views best-effort without blocking rendering

## 2. Phase 7B. Adjacent Article Navigation

- [ ] 2.1 Extend the news repository with adjacent published-article lookup for `newer` and `older` navigation
- [ ] 2.2 Extend the news service/detail API to include navigation payload with minimal article metadata
- [ ] 2.3 Update the news detail composable/types/page to render `Newer Post` and `Older Post` links
- [ ] 2.4 Verify navigation behavior for first article, last article, and middle article scenarios

## 3. Phase 7C. Bulk Import and Progress Dashboard

- [ ] 3.1 Add schema/migrations for `import_batches` and `import_items`, including status, timestamps, retry metadata, and item-to-news linkage
- [ ] 3.2 Add repositories and services for batch creation, item creation, batch aggregation, and item listing
- [ ] 3.3 Add `POST /api/admin/import/bulk` with `requireAdmin`, URL/category validation, max-100 enforcement, batch/item creation, enqueue behavior, and HTTP 202 response
- [ ] 3.4 Add admin composables and pages for bulk import submission with textarea URLs and category dropdown
- [ ] 3.5 Add admin batch list/detail progress dashboard showing Pending, Processing, Published, and Failed counts/status
- [ ] 3.6 Verify no direct frontend Supabase business-data calls are introduced in the import flows

## 4. Phase 7D. Scraping Reliability and Alerting

- [ ] 4.1 Add scraping worker logic to fetch remote URLs, extract article data, sanitize content, and create published news through existing service/repository boundaries
- [ ] 4.2 Update import item and batch status transitions for pending, processing, published, failed, completed, and completed-with-failures paths
- [ ] 4.3 Configure retry attempts = 3 with exponential backoff for scrape jobs
- [ ] 4.4 Add explicit DLQ handling for terminal failures and persist failure details to import items
- [ ] 4.5 Add SMTP alert service and send DLQ failure notifications with batch/item/source URL context
- [ ] 4.6 Verify successful scrape publishing, retry behavior, terminal failure behavior, and alert emission paths

## 5. Quality Gates

- [ ] 5.1 Add or update specs/tests for async view counting, adjacent navigation, import batch APIs, and worker reliability behavior
- [ ] 5.2 Run `npm run typecheck`
- [ ] 5.3 Run `npm run lint`
- [ ] 5.4 Manual: verify detail page still loads normally while view requests return 202
- [ ] 5.5 Manual: verify admin can submit an import batch, see progress changes, and inspect failures
