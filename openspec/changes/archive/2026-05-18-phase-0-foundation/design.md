## Context

Project đã có Nuxt 4 scaffolding sạch (build + typecheck + lint pass), nhưng `server/` hoàn toàn trống, `app/types/` chỉ có placeholder, `app/middleware/` và `app/utils/` chưa tồn tại. Phase 0 đặt nền móng cho tất cả code phía sau.

Ba nhiệm vụ tách biệt nhưng cần hoàn thành theo thứ tự:
1. **T0.1** — shell infrastructure (types + server utils + folder scaffolding)
2. **T0.2** — database schema (Supabase migrations, DTOs, mappers)
3. **T0.3** — auth system (store, middleware, composable, server helper)

## Goals / Non-Goals

**Goals:**
- `app/types/api.ts` chứa `ApiSuccess<T>` và `ApiError` đầy đủ — dùng từ Phase 1
- `server/utils/errors.ts` và `server/utils/response.ts` — helpers cho mọi API handler
- `server/utils/auth.ts` — `requireAuth(event)` guard
- Folder structure đúng theo SDD: `server/api/`, `server/services/`, `server/repositories/`
- SQL migration cho `categories` và `news` với RLS
- `app/types/database.types.ts` regenerate từ Supabase thật
- App DTOs: `app/types/news.ts`, `app/types/category.ts`
- Mappers: `app/utils/mappers/news.ts`, `app/utils/mappers/category.ts`
- Auth store, route middleware, `useAuth` composable

**Non-Goals:**
- Không implement API handlers (Phase 1)
- Không implement UI (Phase 2+)
- Không viết Zod validators cho news/category (Phase 1 khi cần)
- Không seed data phức tạp

## Decisions

**T0.1 — Validators tại `app/utils/validators/` không phải `server/schemas/`**
Zod schemas cần dùng ở cả client form (Phase 2) và server API (Phase 1). Đặt trong `app/utils/validators/` để cả hai phía import được. `server/` trong Nuxt 4 không thể import trực tiếp từ `app/` nên sẽ dùng alias `~/utils/validators/` — Nitro hiểu alias `~` trỏ vào `srcDir`.

**T0.1 — `server/utils/errors.ts` pattern**
```ts
export function createApiError(statusCode: number, code: string, message: string, details?: unknown) {
  return createError({ statusCode, data: { error: { code, message, details } } })
}
```
Tập trung error shape vào một nơi, tránh inconsistency qua các handler.

**T0.2 — Schema Supabase: categories trước, news sau**
`news.category_id` foreign key vào `categories.id` → categories migration phải chạy trước.

**T0.2 — `view_count` increment server-side only**
Client không được gửi view_count. `POST /api/news/:id/view` gọi `UPDATE news SET view_count = view_count + 1` server-side để tránh manipulation.

**T0.3 — Auth store minimal**
Store chỉ giữ `user` ref và computed `isAuthenticated`. Không cache role phức tạp ở MVP — user table chưa có role column, admin được xác định bằng Supabase Auth user metadata hoặc hardcode email whitelist tạm thời.

**T0.3 — `middleware/auth.ts` dùng `useSupabaseUser()` không phải store**
`useSupabaseUser()` đã được `@nuxtjs/supabase` inject và reactive. Route middleware đọc trực tiếp để tránh dependency vào store hydration trên server-side rendering.

## Risks / Trade-offs

- **[Risk] `~/utils/validators/` trong server/**: Nuxt 4 + Nitro hỗ trợ `~` alias nhưng cần verify sau khi viết handler thật. → Mitigation: test import trong T1.1 ngay lần đầu dùng.
- **[Risk] `database.types.ts` stale**: Nếu schema thay đổi sau T0.2 mà quên regenerate, type sẽ out of sync. → Mitigation: ghi rõ trong AGENTS.md command regenerate, chạy sau mỗi migration.
- **[Risk] Admin auth bằng email whitelist tạm**: Không scalable, nhưng MVP không có role table. → Mitigation: document rõ là tạm, Phase 5 hardening sẽ migrate sang `app_metadata.role`.

## Migration Plan

1. Apply migrations theo thứ tự: `create_categories` → `create_news`
2. Chạy `npx supabase gen types typescript --project-id "$SUPABASE_PROJECT_REF" > app/types/database.types.ts`
3. Verify build + typecheck + lint pass sau mỗi task (T0.1, T0.2, T0.3)
