## Context

Repo hiện có public read APIs cho news/categories, auth baseline tối thiểu, và public UI đã chạy được. Tuy nhiên server layer chưa có admin CRUD contract nào, trong khi RLS hiện tại vẫn cho mọi authenticated user quyền write vào `news` và `categories`, và cho authenticated user đọc cả draft/archived news. Điều này không khớp với mô hình vận hành admin panel sắp tới.

Phase này là backend prerequisite cho Phase 4 admin UI. Nó cần vừa tạo ra admin API surface ổn định, vừa siết permission model để UI phase sau không build trên một security posture sai.

## Goals / Non-Goals

**Goals:**
- Thêm admin CRUD APIs cho `news` và `categories`
- Thêm `GET /api/auth/me` để trả current session shape an toàn cho client và expose admin entitlement
- Tạo `requireAdmin(event)` / equivalent server guard dùng được chung cho admin endpoints
- Tighten RLS để only admin mới write được categories/news và mới đọc được draft/archived news
- Giữ nhất quán với kiến trúc hiện tại: `server/api` → `server/services` → `server/repositories`
- Chuẩn hóa Zod validation, duplicate-slug conflict handling, và response envelope cho admin endpoints

**Non-Goals:**
- Không build admin UI pages/components trong phase này
- Không thêm role management UI hay multi-role permission matrix
- Không thêm storage upload flow cho thumbnail
- Không thêm audit log, rate limiting, hay anti-abuse hardening

## Decisions

### D1. Dùng `app_metadata.role = 'admin'` làm nguồn authority
Admin entitlement sẽ đọc từ Supabase Auth `app_metadata.role`. Server guard và RLS cùng dựa trên nguồn này để tránh lệch semantics giữa app layer và database layer.

- **Alternative:** email whitelist tạm thời. Rejected vì brittle và không phù hợp khi move sang admin UI thật.
- **Alternative:** tạo bảng `roles` riêng ngay bây giờ. Rejected vì mở rộng schema và auth model vượt quá scope MVP.

### D2. Giữ admin CRUD trong domain repositories hiện có
Thay vì tạo `admin-news.repository.ts` và `admin-category.repository.ts`, phase này sẽ mở rộng `news.repository.ts` và `category.repository.ts` với admin CRUD/query functions. Access mode khác nhau nhưng domain vẫn là `news` và `category`, nên giữ code theo ownership hiện tại sẽ ít phân mảnh hơn.

- **Alternative:** tách repository riêng theo access mode. Rejected vì duplication cao và làm phase 4 UI khó theo dõi hơn.

### D3. Admin endpoints dùng `serverSupabaseClient(event)` mặc định, không service role cho CRUD thường
Sau khi `requireAdmin(event)` pass, repository vẫn dùng `serverSupabaseClient(event)` để query/mutate dưới user context thật, để RLS tiếp tục là lớp enforce thứ hai. Service role chỉ nên dùng cho seed/bootstrap role hoặc tác vụ vận hành không nằm trong admin CRUD request path.

- **Alternative:** dùng `serverSupabaseServiceRole(event)` cho toàn bộ admin APIs. Rejected vì bypass RLS quá rộng và tăng blast radius nếu service code sai.

### D4. `GET /api/auth/me` trả safe DTO, không trả raw Supabase user
Endpoint session sẽ trả shape tối thiểu phục vụ app: `id`, `email`, `role`, `isAdmin`. Điều này đủ cho admin shell bootstrap mà không leak toàn bộ raw user metadata/session internals vào client surface.

- **Alternative:** expose raw `User` object từ Supabase. Rejected vì payload dư và coupling chặt vào vendor shape.

### D5. News publish semantics được chuẩn hóa ở service layer
Admin news create/update input sẽ cho phép `status` và `publishedAt`. Nếu `status = 'published'` nhưng `publishedAt` trống, service sẽ set `published_at = now()`. Nếu status không phải `published`, `published_at` có thể để `null`.

- **Alternative:** bắt UI luôn gửi `publishedAt`. Rejected vì đẩy business rule sang client.

### D6. Categories cũng cần detail endpoint theo ID
Mặc dù public categories không cần fetch theo ID, admin editor route `/admin/categories/[id]` cần direct-load data ổn định khi reload trang. Vì vậy admin category APIs sẽ có `GET /api/admin/categories/:id` bên cạnh list/create/update/delete.

- **Alternative:** edit page chỉ reuse từ list response. Rejected vì direct navigation/reload sẽ thiếu data source rõ ràng.

## Risks / Trade-offs

- [JWT claims trong `app_metadata` có thể stale cho tới khi session refresh] → Document rõ trong auth/admin flow; `GET /api/auth/me` phải phản ánh current decoded user, và admin setup/seed cần yêu cầu re-login sau khi đổi role.
- [RLS tightening có thể làm seed/dev flow hiện tại gãy nếu đang dựa vào authenticated write rộng] → Thêm migration/seed rõ ràng cho admin role bootstrap và verify lại public APIs sau migration.
- [Mở rộng repository hiện có cho cả public và admin path làm file dài hơn] → Giữ naming rõ ràng theo function prefix (`findPublished...`, `findAdmin...`, `insert...`, `update...`) để tránh lẫn trách nhiệm.
- [Delete category có side effect lên news qua FK `ON DELETE SET NULL`] → Spec explicit rằng API delete category được phép và news rows sẽ tiếp tục tồn tại với `category_id = null`.

## Migration Plan

1. Thêm migration cập nhật RLS policies cho `categories` và `news` theo admin-only semantics
2. Thêm seed/bootstrap SQL hoặc documented admin-role setup path để gán `app_metadata.role = 'admin'`
3. Implement server guard, validators, repositories, services, và admin API handlers
4. Implement `GET /api/auth/me` safe DTO endpoint
5. Verify `npm run typecheck` + `npm run lint`, và test các đường public API không bị regression sau RLS change

## Open Questions

- Hiện chưa cần role ngoài `admin`; phase này assume binary entitlement: admin vs non-admin.
