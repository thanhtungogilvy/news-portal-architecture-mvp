# Worker 2 — Import

Scrape bài viết từ URL bên ngoài, parse nội dung, publish vào bảng `news`, và enqueue embedding job cho bước tiếp theo.

---

## Tổng quan

Admin tạo một **import batch** gồm danh sách URL. Worker lần lượt scrape từng URL, tạo bài viết, và xử lý retry khi thất bại. Khi batch hoàn thành có bài thất bại, system gửi email alert.

---

## Luồng xử lý

```mermaid
sequenceDiagram
    actor Admin
    participant AdminUI as Admin UI
    participant BatchAPI as POST /api/admin/import
    participant DB as import_batches<br/>import_items
    participant Worker as Import Worker
    participant Web as External URL (scrape)
    participant News as news table
    participant EmbQueue as embedding_jobs

    Admin->>AdminUI: upload URL list + chọn category
    AdminUI->>BatchAPI: POST { urls[], category_id }
    BatchAPI->>DB: INSERT batch + N items (status: pending)
    BatchAPI-->>AdminUI: { batch_id }

    loop poll mỗi 10s (local) / mỗi 1 phút (prod)
        Worker->>DB: recoverStuckImportItems()<br/>(items processing > 10 phút → reset pending)
        Worker->>DB: claimPendingImportItems(batch_size=5)<br/>FOR UPDATE SKIP LOCKED
        loop từng item
            Worker->>DB: dedup check (source_url đã tồn tại?)
            alt đã tồn tại
                Worker->>DB: markPublished(reuse news_id)
            else chưa có
                Worker->>Web: scrapeArticle(url)
                Web-->>Worker: { title, content, summary, thumbnail, author }
                Worker->>News: INSERT news (status: published)
                Worker->>DB: markImportItemPublished(news_id)
                Worker->>EmbQueue: enqueueEmbeddingJob(article_id)
            end
            Worker->>DB: syncBatchStatus()
        end
        alt tick % 6 == 0
            Worker->>DB: findBatchesNeedingFailureAlert()
            Worker->>Admin: sendBatchFailureAlert (email)
        end
    end
```

---

## Retry logic

```mermaid
stateDiagram-v2
    [*] --> pending : item inserted
    pending --> processing : claim
    processing --> published : scrape + insert OK
    processing --> pending : lỗi, attempt < 3\n(backoff: 1 min / 5 min)
    processing --> failed : attempt >= 3
    failed --> dlq : insert vào import_dlq\nvới scraped snapshot
    published --> [*]
    failed --> [*]
```

**Backoff schedule:**

| Attempt | Retry sau |
|---------|-----------|
| 1 | 1 phút |
| 2 | 5 phút |
| 3+ | Terminal fail → DLQ |

---

## Dedup logic

Import worker kiểm tra 2 tầng dedup để tránh bài bị duplicate:

```mermaid
flowchart TD
    A[Claim item] --> B{source_url đã published?}
    B -->|Có| C[Reuse news_id\nmarkPublished + syncBatch]
    B -->|Không| D[Scrape article]
    D --> E{Slug đã tồn tại?}
    E -->|Có| F[Reuse news by slug]
    E -->|Không| G[INSERT news mới]
    F --> H[markPublished + enqueueEmbedding]
    G --> H
```

---

## Stuck item recovery

Items bị kẹt ở trạng thái `processing` quá 10 phút (worker crash giữa chừng) sẽ được tự động reset về `pending` mỗi tick — đảm bảo không có item nào bị bỏ sót vĩnh viễn.

---

## Database tables

### `import_batches`

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | uuid | PK |
| `category_id` | uuid | FK → `categories.id` |
| `status` | enum | `pending` \| `processing` \| `completed` \| `failed` \| `partial` |
| `total_items` | int | Tổng số URL |
| `failure_email_sent_at` | timestamptz | Đã gửi alert chưa |

### `import_items`

| Column | Type | Mô tả |
|--------|------|-------|
| `id` | uuid | PK |
| `batch_id` | uuid | FK → `import_batches.id` |
| `source_url` | text | URL cần scrape |
| `status` | enum | `pending` \| `processing` \| `published` \| `failed` |
| `attempt_count` | int | Số lần đã thử |
| `retry_after` | timestamptz | Không claim trước thời điểm này |
| `news_id` | uuid | FK → `news.id` sau khi published |
| `error_message` | text | Lỗi cuối |

### `import_dlq`

Dead-letter queue: lưu lại snapshot của những item thất bại hoàn toàn để admin có thể debug.

---

## Files liên quan

```
lib/background/import/
  service.ts     ← processImportItems()
                    recoverStuckImportItems()
                    processBatchAlerts()
                    ensureEmbeddingJob()
  repository.ts  ← claimPendingImportItems()
                    markImportItemPublished()
                    scheduleImportItemRetry()
                    markImportItemFailed()
                    insertImportDlqItem()
                    syncBatchStatus()
                    findBatchesNeedingFailureAlert()
  scraper.ts     ← scrapeArticle(url) → { title, content, ... }
                    generateSlug(title)
  crawler.ts     ← fetchHtml(url) + parseContent()
  alert.ts       ← sendBatchFailureAlert(batch, failedItems)

server/api/internal/cron/
  import.post.ts  ← Nitro handler (production only)
```

---

## Cách chạy

### Local dev

```bash
# Chạy riêng import worker
npx jiti workers/import.ts

# Hoặc chạy cả 3 worker cùng lúc
npm run worker:all
```

### Production (pg_cron)

```sql
-- supabase/migrations/20260526200000_setup_pg_cron_jobs.sql
select cron.schedule(
  'cron-import', '* * * * *',
  $$ select net.http_post(
    url => 'https://verdana-news.vercel.app/api/internal/cron/import',
    headers => jsonb_build_object('Authorization', 'Bearer ' || cron_secret)
  ) $$
);
```

---

## Environment variables

| Var | Default | Mô tả |
|-----|---------|-------|
| `IMPORT_WORKER_POLL_MS` | `10000` | Sleep giữa các tick (local) |
| `IMPORT_WORKER_BATCH_SIZE` | `5` | Items tối đa mỗi tick |
| `IMPORT_WORKER_ALERT_INTERVAL_TICKS` | `6` | Kiểm tra alert mỗi N tick |
| `CRON_SECRET` | — | Bearer token (production) |

---

## Side effect quan trọng

Sau khi publish thành công, import worker **tự động enqueue embedding job** cho bài vừa tạo:

```
Import Worker → INSERT embedding_jobs { article_id, status: 'pending' }
                          ↓
              Embedding Worker sẽ pick up ở tick tiếp theo
```

Điều này đảm bảo mọi bài được import đều có vector embedding cho semantic search và recommendations.
