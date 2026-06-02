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
                              fetch HTML → JSDOM
                              thử 12 CSS selectors theo thứ tự
                              (VnExpress selectors trước → generic)
                              filter URL bằng regex:
                                /[a-z0-9-]*\d{5,}[a-z0-9-]*\.(html?|aspx)$/i
                              → ra discovered URLs

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
1. recoverStuckItems()
   → items ở 'processing' > 5 phút → force 'failed' + DLQ

2. processImportItems(batchSize=5)
   → SELECT pending WHERE next_retry_at <= now LIMIT 5
   → UPDATE to 'processing' WHERE status='pending'  ← guard atomic
   → processOneItem() cho từng item

3. processBatchAlerts()
   → batch terminal + failure_email_sent_at IS NULL?
   → gửi Resend email, mark sent
```

---

### processOneItem() — xử lý 1 URL

```
a. URL dedup
   findPublishedImportByUrl(source_url)
   → URL đã published ở batch khác? reuse news_id, done ✓

b. scrapeArticle(url)   ← xem chi tiết phần 3

c. slug dedup
   generateSlug(title)   ← clean, no timestamp suffix
   findNewsBySlugForImport(slug)
   → slug đã tồn tại? reuse news_id, done ✓

d. insertNews()   status='published', publishedAt=now

e. markPublished() + syncBatchStatus()
```

---

### Retry và Terminal Failure

```
Error xảy ra:
  ├─ non-retriable?
  │    "Could not extract article..."  ← JSDOM parse fail
  │    "HTTP 4xx"                      ← 404, 403 từ nguồn
  │  → terminal ngay, không retry
  │
  ├─ attempt_count >= 3?   → terminal
  │
  └─ else → retry với backoff:
       attempt 1 → next_retry_at = now + 1 min
       attempt 2 → next_retry_at = now + 5 min
       status trở về 'pending'

Terminal:
  markImportItemFailed()
  insertImportDlqItem()    ← lưu payload_snapshot nếu có
  syncBatchStatus()
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

## 3. Scraper — scrapeArticle(url)

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

Fallback cuối: ghép tất cả <p> trong trang
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
