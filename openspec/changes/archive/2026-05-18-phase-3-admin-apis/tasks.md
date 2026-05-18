## 1. Admin Authorization & Schema Tightening

- [x] 1.1 Add Supabase migration(s) to tighten `news` and `categories` RLS from authenticated-write to admin-only write/read semantics
- [x] 1.2 Add admin-role bootstrap/setup artifact under `supabase/seeds/` or equivalent documented SQL path for `app_metadata.role = 'admin'`
- [x] 1.3 Extend `server/utils/auth.ts` with admin-aware session helpers (`requireAdmin` and safe role derivation)

## 2. Session & Validation Foundations

- [x] 2.1 Add app-level auth/session DTOs needed by `GET /api/auth/me`
- [x] 2.2 Add `server/api/auth/me.get.ts` to return the current authenticated user and admin entitlement
- [x] 2.3 Add or extend shared Zod validators for admin category/news create and patch payloads plus admin list query params

## 3. Admin Category APIs

- [x] 3.1 Extend `server/repositories/category.repository.ts` with admin list/detail/create/update/delete functions
- [x] 3.2 Extend `server/services/category.service.ts` with admin authorization and category CRUD flows
- [x] 3.3 Add `server/api/admin/categories/index.get.ts` and `index.post.ts`
- [x] 3.4 Add `server/api/admin/categories/[id].get.ts`, `[id].patch.ts`, and `[id].delete.ts`

## 4. Admin News APIs

- [x] 4.1 Extend `server/repositories/news.repository.ts` with admin list/detail/create/update/delete functions
- [x] 4.2 Extend `server/services/news.service.ts` with admin authorization and publish-state handling
- [x] 4.3 Add `server/api/admin/news/index.get.ts` and `index.post.ts`
- [x] 4.4 Add `server/api/admin/news/[id].get.ts`, `[id].patch.ts`, and `[id].delete.ts`

## 5. Verification

- [x] 5.1 Verify public read APIs still behave correctly after the RLS change
- [x] 5.2 Run `npm run typecheck`
- [x] 5.3 Run `npm run lint`
