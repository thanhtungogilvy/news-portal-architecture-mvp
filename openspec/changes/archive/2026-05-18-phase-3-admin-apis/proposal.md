## Why

Phase 2 đã hoàn thành public UI, nhưng hệ thống vẫn chưa có admin APIs để quản trị categories và news. Nếu không có phase này, Phase 4 admin UI sẽ không có backend contract ổn định để list, create, edit, publish, hay delete content.

## What Changes

- Thêm admin API layer cho `news`: list, create, detail, update, delete với auth guard và admin-only authorization.
- Thêm admin API layer cho `categories`: list, create, detail, update, delete với auth guard và admin-only authorization.
- Thêm session-facing API cho admin surface để lấy current user và xác định quyền admin từ Supabase Auth.
- Tighten permission model ở Supabase để write access và draft/archived reads không còn mở cho mọi authenticated user.
- Chuẩn hóa server-side admin guard, validation schemas, và error mapping cho toàn bộ admin endpoints.

## Capabilities

### New Capabilities

- `admin-news-api`: Admin CRUD APIs cho news với pagination, filtering, và editor-ready detail fetch
- `admin-categories-api`: Admin CRUD APIs cho categories với duplicate-slug protection và editor-ready detail fetch
- `admin-session-api`: API để trả current authenticated user và admin entitlement cho admin surface bootstrap

### Modified Capabilities

- `database-schema`: RLS requirements thay đổi từ authenticated-write sang admin-only write/read semantics cho admin-managed content

## Impact

- `server/api/admin/**` — toàn bộ admin endpoints mới cho news và categories
- `server/api/auth/me.get.ts` — current-session endpoint cho admin surface
- `server/services/*.ts` và `server/repositories/*.ts` — thêm admin CRUD flows, authorization, và query paths
- `server/utils/auth.ts` — cần admin guard/helper thay vì chỉ `requireAuth`
- `app/utils/validators/news.ts` và validator categories mới — dùng chung cho admin API input
- `app/types/auth.ts` hoặc app-level auth DTO — nếu cần expose admin-safe session shape ra client
- `supabase/migrations/` và `supabase/seeds/` — RLS tightening và admin role bootstrap/update path
