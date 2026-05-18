## Why

Project đã có Nuxt 4 scaffolding và config đúng chuẩn, nhưng chưa có server layer, type foundations, database schema, hay auth system. Không có foundation này, không phase nào tiếp theo có thể được triển khai đúng cách.

## What Changes

- **T0.1 — Project shell hoàn chỉnh**: tạo `app/types/api.ts` (ApiSuccess/ApiError), `server/utils/` helpers (errors, response), scaffold toàn bộ folder structure còn thiếu (`server/`, `app/middleware/`, `app/utils/`)
- **T0.2 — Database baseline**: migration SQL cho `categories` và `news`, app DTOs (`app/types/category.ts`, `app/types/news.ts`), mappers, regenerate `database.types.ts` từ Supabase
- **T0.3 — Auth baseline**: Pinia auth store, route middleware (`auth.ts`, `guest.ts`), `useAuth` composable, `requireAuth` server helper

## Capabilities

### New Capabilities

- `api-types`: Response envelope types `ApiSuccess<T>` và `ApiError` dùng chung toàn app
- `server-utils`: Server-side helpers `requireAuth`, `createApiError`, response wrappers
- `database-schema`: Supabase schema cho `categories` và `news` với RLS, app DTOs, mappers
- `auth-baseline`: Login/logout flow qua Supabase Auth, session store, route guard middleware

### Modified Capabilities

<!-- Không có — đây là greenfield -->

## Impact

- `app/types/api.ts` — được import bởi mọi composable và server handler từ Phase 1 trở đi
- `server/utils/` — được auto-import bởi Nitro trong toàn bộ `server/`
- `app/types/database.types.ts` — sẽ được regenerate, thay thế placeholder hiện tại
- `app/stores/auth.ts` + `app/middleware/auth.ts` — guard toàn bộ `/admin/*` routes từ Phase 4
- `supabase/migrations/` — cần apply vào Supabase project trước khi Phase 1 query được data
