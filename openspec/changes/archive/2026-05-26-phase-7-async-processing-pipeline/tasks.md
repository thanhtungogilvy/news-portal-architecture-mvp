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

- [x] 3.1 Add schema/migrations for `import_batches`, `import_items`, and `import_batches.failure_email_sent_at`, including status, timestamps, retry metadata, and item-to-news linkage
- [x] 3.2 Add repositories and services for batch creation, item creation, batch aggregation, and item listing
- [x] 3.3 Add `POST /api/admin/import/bulk` with `requireAdmin`, URL/category validation, max-100 enforcement, batch/item creation, pending-job creation behavior, and HTTP 202 response
- [x] 3.4 Add admin composables and pages for bulk import submission with textarea URLs and category dropdown
- [x] 3.5 Add admin batch list/detail progress dashboard showing Pending, Processing, Published, and Failed counts/status
- [x] 3.6 Verify no direct frontend Supabase business-data calls are introduced in the import flows

## 4. Phase 7D. Scraping Reliability and Alerting

- [x] 4.1 Add schema/migrations for `import_dlq_items` to persist terminal failures
- [x] 4.2 Add scraping worker logic to poll pending `import_items`, fetch remote URLs, extract article data, sanitize content, and create published news through existing service/repository boundaries
- [x] 4.3 Update import item and batch status transitions for pending, processing, published, failed, completed, and completed-with-failures paths
- [x] 4.4 Configure retry max = 3 with exponential backoff scheduling in persisted job state
- [x] 4.5 Add explicit DLQ-table handling for terminal failures and persist failure details to `import_dlq_items`
- [x] 4.6 Add Resend alert service using `RESEND_API_KEY`, `RESEND_FROM`, and `ADMIN_EMAIL`
- [x] 4.7 Send one consolidated failure email per batch and persist `failure_email_sent_at` to avoid duplicate alerts
- [x] 4.8 Verify successful scrape publishing, retry behavior, terminal failure behavior, and alert emission paths

## 5. Phase 7E. Crawl Listing Page

- [x] 5.1 Add `importCrawlSchema` (url, categoryId, maxItems 1-100) to `app/utils/validators/import.ts`
- [x] 5.2 Add `extractArticleLinks(listingUrl, maxItems)` to `lib/background/import/scraper.ts` — fetches listing HTML, discovers article hrefs via selector heuristics, filters by article URL pattern
- [x] 5.3 Add `adminCrawlAndCreateImportBatch()` to `server/services/import.service.ts`
- [x] 5.4 Add `POST /api/admin/import/crawl` with `requireAdmin`, Zod validation, and HTTP 202
- [x] 5.5 Add `crawl()` method to `useAdminImportBatches` composable
- [x] 5.6 Add "Crawl Page" tab to admin import page with listing URL + maxItems inputs

## 6. Phase 7F. Import Deduplication and Auto-Refresh

- [x] 6.1 Add `findPublishedImportByUrl(client, sourceUrl)` to `lib/background/import/repository.ts` — dedup check by source URL across batches
- [x] 6.2 Add `findNewsBySlugForImport(client, slug)` to `lib/background/import/repository.ts` — dedup check by generated slug in news table
- [x] 6.3 Update `processOneItem()` in `lib/background/import/service.ts` to check URL dedup first, then slug dedup before inserting new article
- [x] 6.4 Remove timestamp suffix from `generateSlug()` — slugs are clean title-derived slugs; only surface SLUG_CONFLICT error on unresolvable race condition
- [x] 6.5 Add `useIntervalFn`-based auto-polling (5 s) to `useAdminImportBatches` — stops when no active batches remain
- [x] 6.6 Add `useIntervalFn`-based auto-polling (5 s) to `useAdminImportBatch` — stops when batch reaches terminal status

## 7. Quality Gates

- [x] 7.1 Add or update specs/tests for async view counting, adjacent navigation, import batch APIs, worker polling/claiming behavior, and Resend alert idempotency
- [x] 7.2 Run `npm run typecheck`
- [x] 7.3 Run `npm run lint`
- [x] 7.4 Manual: verify detail page still loads normally while view requests return 202
- [x] 7.5 Manual: verify admin can submit an import batch, see progress changes, and inspect failures
- [x] 7.6 Manual: verify crawl listing page discovers and enqueues article URLs correctly
- [x] 7.7 Manual: verify duplicate URLs across batches produce no duplicate news articles
- [x] 7.8 Manual: verify batch status auto-updates in dashboard without page refresh

## 8. Deployment (Vercel)

- [x] 8.1 Add `server/api/internal/cron/view-count.post.ts` — Vercel Cron route thay cho worker loop: xử lý pending view-count jobs, guard bằng `CRON_SECRET`
- [x] 8.2 Add `server/api/internal/cron/import.post.ts` — Vercel Cron route thay cho worker loop: recover stuck items, process import items, send alerts
- [x] 8.3 Add `vercel.json` với cron schedule `* * * * *` cho cả 2 route
- [x] 8.4 Add `workers/all.ts` — combined local dev entrypoint chạy cả view-count và import loop trong 1 process (`npm run worker:all`)
- [x] 8.5 Add `worker:all` npm script vào `package.json`
