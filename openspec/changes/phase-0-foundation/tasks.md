## 1. T0.1 — API Types & Server Utils

- [x] 1.1 Tạo `app/types/api.ts` với `ApiSuccess<T>`, `ApiError`, `ApiErrorCode` enum
- [x] 1.2 Tạo `server/utils/errors.ts` với `createApiError(statusCode, code, message, details?)`
- [x] 1.3 Tạo `server/utils/response.ts` với `successResponse<T>(data, meta?)` helper
- [x] 1.4 Tạo `server/utils/auth.ts` với `requireAuth(event)` — trả về `User` hoặc throw UNAUTHENTICATED
- [x] 1.5 Scaffold folder structure: `server/api/`, `server/services/`, `server/repositories/`, `app/utils/validators/`, `app/utils/mappers/`, `app/composables/auth/`, `app/composables/news/`, `app/composables/category/`
- [x] 1.6 Verify: `npm run typecheck && npm run lint` pass

## 2. T0.2 — Database Schema & DTOs

- [x] 2.1 Viết SQL migration `supabase/migrations/<timestamp>_create_categories.sql` — table + RLS
- [x] 2.2 Viết SQL migration `supabase/migrations/<timestamp>_create_news.sql` — table + RLS + status check constraint
- [x] 2.3 Apply migrations lên Supabase (via Supabase CLI hoặc dashboard)
- [x] 2.4 Regenerate `app/types/database.types.ts` từ Supabase CLI
- [x] 2.5 Tạo `app/types/category.ts` với `CategoryDto` interface (camelCase fields)
- [x] 2.6 Tạo `app/types/news.ts` với `NewsDto` interface (camelCase fields)
- [x] 2.7 Tạo `app/utils/mappers/category.ts` với `mapCategory(row): CategoryDto`
- [x] 2.8 Tạo `app/utils/mappers/news.ts` với `mapNews(row): NewsDto`
- [x] 2.9 Verify: `npm run typecheck && npm run lint` pass

## 3. T0.3 — Auth Baseline

- [x] 3.1 Tạo `app/stores/auth.ts` — Pinia store với `user`, `isAuthenticated`
- [x] 3.2 Tạo `app/middleware/auth.ts` — redirect `/login` nếu không có session
- [x] 3.3 Tạo `app/middleware/guest.ts` — redirect `/` nếu đã có session
- [x] 3.4 Tạo `app/composables/auth/useAuth.ts` — `signIn`, `signOut`, proxy `user` + `isAuthenticated`
- [x] 3.5 Verify: `npm run typecheck && npm run lint` pass
