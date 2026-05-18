## Why

Phase 0 đã thiết lập nền móng (types, utils, auth, schema). Phase 1 implement các public API endpoints để frontend có thể fetch dữ liệu thật từ Supabase — đây là prerequisite bắt buộc trước khi build UI (Phase 2).

## What Changes

**New Capabilities:**
- `public-categories-api` — GET /api/categories, GET /api/categories/:slug
- `public-news-api` — GET /api/news (với filter/pagination), GET /api/news/featured, GET /api/news/most-viewed, GET /api/news/:slug
- `view-count-api` — POST /api/news/:id/view (increment view count server-side)
- `category-repository` — Supabase queries cho categories
- `news-repository` — Supabase queries cho news
- `category-service` — Business logic cho public category reads
- `news-service` — Business logic cho public news reads

## Impact

**User-facing**: Không có thay đổi UI — Phase 1 là backend-only.

**Breaking changes**: Không — đây là net-new endpoints.

**Dependencies**: Phase 0 foundation phải hoàn thành (✓ archived).

## Constraints

- Public endpoints không yêu cầu auth (anon access qua RLS)
- `view_count` chỉ increment server-side — client không được UPDATE trực tiếp
- Pagination dùng `offset/limit` (không cursor) cho MVP
- `featured` = news có `status = 'published'` sắp xếp theo `published_at DESC`, lấy top N
- `most-viewed` = news có `status = 'published'` sắp xếp theo `view_count DESC`, lấy top N
