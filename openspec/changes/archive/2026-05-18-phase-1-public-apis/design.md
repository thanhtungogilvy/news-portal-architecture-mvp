## Context

Phase 0 cung cấp: `serverSupabaseClient(event)` via `@nuxtjs/supabase`, `requireAuth`, `createApiError`, `successResponse`, mappers (`mapCategory`, `mapNews`), DTOs (`CategoryDto`, `NewsDto`). Phase 1 implement 3-layer stack (repository → service → API handler) cho public read endpoints và 1 write endpoint (view count).

Server hiện tại hoàn toàn trống (`server/api/`, `server/services/`, `server/repositories/` đều empty). Supabase schema đã live với RLS: anon có thể SELECT news WHERE status='published' và SELECT tất cả categories.

## Goals / Non-Goals

**Goals:**
- Implement đầy đủ 7 public endpoints theo SDD
- Repository layer dùng `serverSupabaseClient(event)` — RLS tự enforce
- Service layer chứa business logic (filter, sort, pagination logic)
- API handler: validate query params (Zod) → delegate service → wrap envelope
- Zod validators cho query params đặt trong `app/utils/validators/`

**Non-Goals:**
- Không implement admin endpoints (Phase 3)
- Không implement auth-required endpoints
- Không viết E2E tests (Phase 5)
- Không implement cursor pagination — offset/limit đủ cho MVP

## Decisions

**Repository dùng `serverSupabaseClient` không phải `serviceRole`**
Public read endpoints không cần bypass RLS. `serverSupabaseClient(event)` giữ anon context, RLS tự lọc `status = 'published'`. Service role chỉ dùng trong admin layer (Phase 3).

**`view_count` increment dùng Postgres expression, không read-modify-write**
```ts
.update({ view_count: supabase.rpc('...') }) // KHÔNG dùng
// Thay bằng:
supabase.rpc('increment_view_count', { news_id: id })
// Hoặc raw SQL UPDATE: SET view_count = view_count + 1 WHERE id = $id
```
Tránh race condition khi nhiều user cùng xem. Dùng `.update()` với Postgres expression `view_count + 1` thông qua Supabase API không được support trực tiếp → dùng `rpc` hoặc chấp nhận atomic update với service role.

**Quyết định**: Dùng `serverSupabaseServiceRole` chỉ cho `POST /api/news/:id/view` vì cần bypass RLS để UPDATE, nhưng không expose user data — đây là safe exception. Không cần auth check cho endpoint này.

**Pagination: offset/limit qua query params**
`?page=1&limit=10` → `offset = (page-1) * limit`. Trả `meta: { total, page, limit }` trong response. Zod schema validate `page >= 1`, `limit` trong range [1, 50].

**Zod validators ở `app/utils/validators/`**
Theo convention đã lock: `app/utils/validators/news.ts` và `app/utils/validators/category.ts` export query param schemas dùng chung client + server.

**News list filter**: Chỉ filter theo `category_id` (slug lookup trước) cho MVP. Sort mặc định: `published_at DESC`.

## Risks / Trade-offs

- **[Risk] `view_count` dùng serviceRole**: Mọi request xem bài đều bypass RLS. → Mitigation: Endpoint chỉ UPDATE `view_count`, không SELECT bất kỳ data nhạy cảm nào. Không return data sau update.
- **[Risk] N+1 query cho category join trong news list**: Nếu query news rồi query category riêng cho từng row. → Mitigation: Dùng Supabase join `select('*, categories(*)')` trong repository để fetch cùng lúc.
- **[Risk] `view.post.ts` có thể bị spam**: Không có rate limiting ở MVP. → Mitigation: Acceptable cho MVP — Phase 5 hardening sẽ thêm.

## Migration Plan

Không có migration schema (Phase 0 đã xong). Chỉ thêm file code. Rollback: xóa các file đã tạo.
