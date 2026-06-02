# Phase 7 — Async Pipeline Internals

## 1. View Count

### Flow toàn bộ

```
User visit /news/[slug]
  → page mount (client-side only)
  → useNewsDetail.recordView(id)
  → POST /api/news/:id/view
       ↓
  insert view_count_jobs { news_id, status: 'pending' }
  return HTTP 202 ngay  ← non-blocking

  (optimistic: viewCount++ local ngay, không chờ)

                     ↓  mỗi phút (pg_cron → pg_net)

POST /api/internal/cron/view-count
  → claim_pending_view_count_jobs(25)   ← stored func Postgres
      SELECT FOR UPDATE SKIP LOCKED     ← atomic, no race
      flip to 'processing'
  → for each job:
      increment_news_view_count(news_id)
        UPDATE news SET view_count = view_count + 1
      mark 'completed' / 'failed'
```

### Điểm quan trọng

- **Không có retry** — fail thì mark `failed`, bỏ. View count không critical.
- **Optimistic local increment** — `recordView()` bump `viewCount + 1` trong memory ngay sau 202, user không thấy delay.
- **`FOR UPDATE SKIP LOCKED`** — nếu có 2 cron chạy song song, không tranh nhau cùng row.
- **`SECURITY DEFINER`** trên cả 2 stored functions — bypass RLS vì anon user không có quyền write trực tiếp.
- **Scheduler là pg_cron + pg_net** — không có `vercel.json`. pg_cron gọi HTTP endpoint từ database.

---

## 2. Import Pipeline — Bulk vs Crawl

### So sánh điểm vào

```
BULK                          CRAWL
────────────────────────────────────────────────────────
Admin paste N URLs thủ công  Admin paste 1 listing URL
{ urls[], categoryId }        { url, categoryId, maxItems }
                                  ↓
fetch HTML → JSDOM (timeout 15s)
              Thu thập links (2 pass):
                Pass 1 — targeted selectors (13 entries, ưu tiên cao hơn):
                  h3.title-news a, h4.title-news a, .title-news a    ← VnExpress
                  article h2/h3 a, .article-item h2/h3 a
                  .news-item h2/h3 a, .item-news h3 a
                  h2/h3/h4 a                                         ← generic fallback
                Pass 2 — sweep toàn bộ a[href] trong trang
              filter URL:
                - cùng origin với listing URL
                - match regex: /\/[a-z0-9-]*\d{5,}[a-z0-9-]*\.(html?|aspx)$/i
                - không phải root / hay path không có extension
              dedup: Set<string> (strip query + hash)
              Pagination (tối đa 10 trang):
                findNextPageUrl() thử theo thứ tự:
                  a[rel="next"], a.next_page, .pagination a.next     ← semantic
                  active page number + link đến page+1               ← numeric
                  VnExpress URL pattern: base-p2, base-p3            ← URL-based
                → stop khi seen.size >= maxItems hoặc không tìm ra next
              → ra { urls: slice(0, maxItems), discovered: seen.size }

             Từ đây GIỐNG NHAU 100%
             ─────────────────────
             verify category tồn tại
             normalize + dedup URLs (trim, Set)
             insert 1 import_batches row (status: 'pending')
             insert N import_items rows (status: 'pending')
             return HTTP 202 + { batchId, accepted }
```

> **Crawl chỉ discover URLs** — không scrape nội dung ngay. Scrape là việc của worker sau.

---

### Worker (pg_cron mỗi phút)

```
1. recoverStuckImportItems(stuckAfterMinutes=5)
   cutoff = now - 5min
   SELECT * FROM import_items WHERE status='processing' AND started_at < cutoff
   → mỗi item:
       markImportItemFailed(id, reason, attempt_count)
       insertImportDlqItem(...)   ← không có payload_snapshot (scrape chưa xảy ra)
       syncBatchStatus(batch_id)

2. processImportItems(batchSize=5)
   Phase 1 — Claim (atomic two-phase):
     SELECT id, batch_id FROM import_items
       WHERE status='pending' AND next_retry_at <= now
       ORDER BY created_at  LIMIT batchSize
     UPDATE import_items SET status='processing', started_at=now
       WHERE id IN (...) AND status='pending'  ← guard: chỉ claim nếu vẫn còn pending
     → items thực sự claimed = UPDATE result (có thể ít hơn batchSize)

   Phase 2 — Process (sequential, không parallel):
     for each item → processOneItem(item)

   Returns: { claimed, published, retried, failed }

3. processBatchAlerts()
   → findBatchesNeedingFailureAlert():
       WHERE status IN ('completed', 'failed', 'completed_with_failures')
         AND failure_email_sent_at IS NULL
   → mỗi batch (Promise.all song song):
       [failedItems, counts] = await Promise.all([
         getFailedItemsForBatch(batchId),    ← source_url + last_error + attempt_count
         getItemCountsForBatch(batchId),
       ])
       sendBatchFailureAlert({ batchId, batchStatus, publishedCount, failedItems })
       markBatchFailureEmailSent(batchId)
   → Error isolation: 1 batch fail → log error, tiếp tục batch tiếp theo
```

---

### processOneItem() — xử lý 1 URL

```
a. URL dedup
   findPublishedImportByUrl(source_url)
   → URL đã published ở batch khác? reuse news_id, done ✓

b. scrapeArticle(url)   ← xem chi tiết phần 3
   → save scrapedSnapshot { title, summary, thumbnailUrl, authorName }
      dùng để lưu vào DLQ nếu sau này fail terminal

c. getImportBatch(batch_id)
   → lấy category_id cho bước insert

d. Slug generation + dedup
   slug = generateSlug(title)   ← clean, no timestamp suffix
   findNewsBySlugForImport(slug)
   → slug đã tồn tại? reuse news_id, done ✓

e. insertNewsForImport()   status='published', publishedAt=now
   SLUG_CONFLICT race condition handling:
   → Nếu insert throw SLUG_CONFLICT (race giữa check và insert)
     ├─ Re-check findNewsBySlugForImport(slug)
     │   → tìm thấy: reuse news_id (cùng bài)
     │   → không tìm thấy: append suffix vào slug → retry insert
     └─ (suffix dạng: slug + '}'  ← escape valve, rất hiếm xảy ra)

f. markImportItemPublished(itemId, newsId)
   syncBatchStatus(batch_id)
```

### syncBatchStatus() — derive batch status từ item counts

```
SELECT status FROM import_items WHERE batch_id = ?
→ đếm: { pending, processing, published, failed }
→ active = pending + processing

if (active > 0)              → 'processing'
else if (failed === 0)        → 'completed'
else if (published === 0)     → 'failed'
else                          → 'completed_with_failures'

UPDATE import_batches SET status=newStatus WHERE id = batchId

Gọi sau MỌI thay đổi trạng thái item — không có interval riêng.
```

---

### Retry và Terminal Failure

```
newAttemptCount = item.attempt_count + 1

Error xảy ra:
  ├─ non-retriable?
  │    startsWith('Could not extract article')  ← title/content fail
  │    startsWith('HTTP 4')                      ← 404, 403, 400...
  │  → terminal ngay, không retry (kể cả attempt 1)
  │
  ├─ newAttemptCount >= MAX_RETRIES (3)?  → terminal
  │
  └─ else → retry với backoff:
       newAttemptCount=1 → next_retry_at = now + 1 min
       newAttemptCount=2 → next_retry_at = now + 5 min
       UPDATE import_items SET status='pending', attempt_count, last_error,
                               next_retry_at, finished_at=NULL

Terminal failure:
  markImportItemFailed(itemId, errorMsg, newAttemptCount)
  insertImportDlqItem({
    item_id, batch_id, source_url,
    failure_reason: errorMsg,
    attempt_count: newAttemptCount,
    payload_snapshot: scrapedSnapshot | null   ← có nếu fail sau scrape
  })
  syncBatchStatus(batch_id)
```

### DLQ — import_dlq_items

```
Lưu mọi terminal failure để debug/replay:
  item_id        UUID
  batch_id       UUID
  source_url     text
  failure_reason text
  attempt_count  int
  payload_snapshot JSON | null   ← { title, summary, thumbnailUrl, authorName }
                                    có nếu scrape thành công nhưng insert fail
                                    null nếu fail trước/trong scrape
```

---

### Batch Status tự derive từ item counts

```
counts = { pending, processing, published, failed }
active  = pending + processing

active > 0              → 'processing'
active=0, failed=0      → 'completed'
active=0, published=0   → 'failed'
else                    → 'completed_with_failures'
```

`syncBatchStatus()` gọi sau **mỗi** item thay đổi — không có interval riêng.

---

## 3. Architecture

### Module boundaries

```
┌─────────────────────────────────────────────────────┐
│  Nuxt App (app/)                                     │
│                                                      │
│  pages/admin/import/        composables/admin/       │
│    index.vue  [id].vue        useAdminImportBatches  │
│       │                       useAdminImportBatch    │
│       └──── useFetch ──────────────┘                 │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (JSON)
┌──────────────────────▼──────────────────────────────┐
│  Nitro Server (server/)                              │
│                                                      │
│  POST /api/admin/import/bulk                         │
│  POST /api/admin/import/crawl                        │
│  GET  /api/admin/import/batches                      │
│  GET  /api/admin/import/batches/:id                  │
│  POST /api/internal/cron/import  ← CRON_SECRET auth  │
│                                                      │
│  services/import.service.ts   ← orchestration        │
│  repositories/import.repository.ts ← HTTP-context    │
└──────────────────────┬──────────────────────────────┘
                       │ supabase-js
┌──────────────────────▼──────────────────────────────┐
│  lib/background/import/  (shared worker logic)       │
│                                                      │
│  service.ts    ← processImportItems()                │
│                   recoverStuckImportItems()           │
│                   processBatchAlerts()               │
│  repository.ts ← Supabase queries (service role)     │
│  scraper.ts    ← fetch + JSDOM + sanitize            │
│  alert.ts      ← Resend email API                    │
└──────────────────────┬──────────────────────────────┘
                       │ supabase-js (service role)
┌──────────────────────▼──────────────────────────────┐
│  Supabase                                            │
│                                                      │
│  import_batches   import_items   import_dlq_items    │
│  news             categories     internal_settings   │
└─────────────────────────────────────────────────────┘
```

> `lib/background/import/` không phụ thuộc vào Nitro/H3 — dùng được cả từ cron endpoint và standalone worker.

---

### Deployment topology — 2 options

```
Option A: pg_cron (production, recommended)
──────────────────────────────────────────
Supabase pg_cron
  → mỗi phút chạy SQL:
      net.http_post(
        url     = 'https://<app>/api/internal/cron/import',
        headers = { Authorization: 'Bearer <cron_secret>' }
      )
  → cron_secret đọc từ bảng internal_settings
    (không hard-code trong migration)

Vercel CRON_SECRET env var phải khớp với internal_settings.cron_secret

Ưu điểm:
  - Không tốn thêm infra (chạy trong Supabase)
  - Vercel serverless function — scale tự động
  - Nếu 2 pg_cron trigger trùng nhau:
      atomic claim (WHERE status='pending') ngăn double-process

Option B: Standalone Node.js worker
────────────────────────────────────
workers/all.ts  (hoặc workers/import.ts riêng lẻ)
  Chạy: node --experimental-strip-types workers/all.ts

Hai vòng lặp bất đồng bộ song song (Promise.all):
  runViewCount()  poll mỗi VIEW_COUNT_WORKER_POLL_MS  (default 2s)
  runImport()     poll mỗi IMPORT_WORKER_POLL_MS      (default 10s)

processBatchAlerts() gọi mỗi IMPORT_WORKER_ALERT_INTERVAL_TICKS ticks (default 6)
  → ~60s với default 10s poll

Graceful shutdown: SIGINT / SIGTERM → shuttingDown = true → vòng lặp exit sau tick hiện tại

Env vars:
  SUPABASE_URL           hoặc NUXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_KEY   hoặc SUPABASE_SERVICE_ROLE_KEY
  VIEW_COUNT_WORKER_POLL_MS       (default 2000)
  VIEW_COUNT_WORKER_BATCH_SIZE    (default 25)
  IMPORT_WORKER_POLL_MS           (default 10000)
  IMPORT_WORKER_BATCH_SIZE        (default 5)
  IMPORT_WORKER_ALERT_INTERVAL_TICKS (default 6)
```

---

### Supabase tables

```
import_batches
  id                UUID PK
  category_id       UUID FK → categories
  created_by        UUID FK → auth.users
  source_count      int     ← số URL khi tạo batch
  status            text    ← pending | processing | completed | failed | completed_with_failures
  failure_email_sent_at timestamptz | null
  created_at / updated_at

import_items
  id                UUID PK
  batch_id          UUID FK → import_batches
  source_url        text UNIQUE (per batch? hay global?)
  status            text    ← pending | processing | published | failed
  attempt_count     int     default 0
  next_retry_at     timestamptz  default now()   ← dùng để gate retry
  started_at        timestamptz | null
  finished_at       timestamptz | null
  last_error        text | null
  news_id           UUID FK → news | null
  created_at / updated_at

import_dlq_items
  id                UUID PK
  item_id           UUID FK → import_items
  batch_id          UUID FK → import_batches
  source_url        text
  failure_reason    text
  attempt_count     int
  payload_snapshot  jsonb | null
  created_at

internal_settings
  key               text PK
  value             text
  (RLS: chỉ service role đọc được)
```

---

### Cron secret flow

```
Migration 20260526200000_setup_pg_cron_jobs.sql tạo:
  - extension pg_net
  - bảng internal_settings (RLS: service role only)
  - 2 cron jobs đọc secret từ internal_settings

Sau migration, admin chạy thủ công:
  INSERT INTO internal_settings (key, value)
  VALUES ('cron_secret', '<secret>')
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

Vercel: CRON_SECRET = <cùng secret>

Server handler:
  verifyCronSecret(event):
    if (!CRON_SECRET) return   ← dev mode: bỏ qua
    if header Authorization !== 'Bearer <CRON_SECRET>' → 401
```

---

## 4. Scraper — scrapeArticle(url)

### Bước 1: Fetch HTML

```
fetch(url, headers: { User-Agent: NewsImportBot, Accept-Language: vi-VN })
timeout: 15s

HTTP 4xx → non-retriable
HTTP 5xx → retriable
```

### Bước 2: Parse với JSDOM

```ts
const dom = new JSDOM(html, { url })
```

### Bước 3: Extract từng field

```
TITLE    og:title → twitter:title → <h1> → doc.title
SUMMARY  og:description → meta[description] → twitter:description
THUMB    og:image → twitter:image
AUTHOR   meta[name=author] → article:author → [itemprop=author name]
BODY     xem bước 4
```

### Bước 4: Extract body — thử selector theo thứ tự

```
1. [itemprop="articleBody"]   ← schema.org
2. .fck_detail                ← VnExpress
3. .article-body
4. .article-content
5. .post-content
6. .entry-content
7. .content-detail
8. article
9. main

Điều kiện: innerHTML.length > 200, nếu không đủ → thử tiếp

Trước khi lấy: xóa noise bên trong element:
  script, style, .advertisement, .ads, [class*=social], [class*=related]

Fallback cuối: ghép tất cả <p> trong trang → join '\n'
```

### Bước 4b: Normalize images — normalizeContentImages(rawHtml, pageUrl)

```
Mỗi <img> trong body:
  1. Tìm src theo thứ tự ưu tiên:
       src attribute
       data-src, data-original, data-lazy-src, data-url  ← lazy-load attrs
       srcset (lấy phần tử đầu tiên sau split ',')

  2. resolveImageUrl(candidate, pageUrl):
       protocol relative (//...)  → https://...
       relative path             → resolved với new URL(path, pageUrl)
       javascript: / data: / vbscript:  → null (bỏ)
       không phải http/https     → null (bỏ)

  3. src hợp lệ → setAttribute('src', normalizedSrc)
                  removeAttribute('srcset')
                  remove tất cả data-* lazy attrs
     src null   → img.remove()

Mục đích: đảm bảo img.src luôn là URL tuyệt đối http/https hợp lệ
         trước khi đưa vào sanitize.
```

### Bước 5: Sanitize

```
allowedTags:  p, br, strong, em, u, s, a, ul, ol, li,
              blockquote, code, pre, h2, h3, h4, img, hr
allowedAttrs: a[href/title/target/rel], img[src/alt/title]
schemes:      http, https only
mode:         discard (tag không có trong list → strip)
```

### Bước 6: Validate

```
title rỗng?          → throw "Could not extract article title"   → non-retriable
content < 50 chars?  → throw "Could not extract article content" → non-retriable
```

### Output

```ts
{
  title:        string        // max 500 chars
  summary:      string | null // max 1000 chars
  content:      string        // sanitized HTML
  thumbnailUrl: string | null
  authorName:   string | null // max 200 chars
}
```

### Điểm yếu thực tế

| Tình huống | Kết quả |
|-----------|---------|
| Site SPA (React/Vue render JS) | Fetch HTML thô, JS không chạy → body rỗng → non-retriable fail |
| Site block bot (Cloudflare, 403) | HTTP 4xx → non-retriable fail ngay |
| Site chậm > 15s | Timeout → retriable |
| Markup không khớp selector nào | Fallback `<p>` — chất lượng thấp nhưng không crash |
| Nội dung < 50 chars sau sanitize | Non-retriable fail |
