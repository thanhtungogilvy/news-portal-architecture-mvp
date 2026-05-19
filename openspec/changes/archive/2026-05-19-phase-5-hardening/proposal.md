## Why

The core application features are complete through phase 4. Several reliability, security, and testability gaps remain: unexpected server errors can leak raw Supabase messages to clients, the app has no user-facing error boundary for 404/500 navigation failures, public API endpoints do not set HTTP cache headers, and test coverage is sparse for the validators, mappers, and HTML sanitization logic that form the security and data-integrity boundaries.

## What Changes

- Add `app/error.vue` — user-facing error page handling 404, 500, and generic client-side navigation errors
- Add Nitro `onError` plugin — normalizes all unhandled server errors to the standard `INTERNAL_ERROR` envelope so raw DB/runtime errors are never exposed
- Add `Cache-Control` headers on public `GET` API endpoints (`/api/news`, `/api/news/featured`, `/api/news/most-viewed`, `/api/news/:slug`, `/api/categories`, `/api/categories/:slug`)
- Expand unit test coverage for Zod validators (`newsCreateSchema`, `newsListQuerySchema`, `adminNewsListQuerySchema`, `categoryCreateSchema`), mappers (`mapNews`, `mapCategory`), and the HTML `sanitize()` helper

## Capabilities

### New Capabilities

- `error-page`: User-facing Nuxt error page (`app/error.vue`) that renders a meaningful message and recovery CTA for 404 and 500 errors caught by Nuxt's error boundary

### Modified Capabilities

- `server-utils`: Add requirement for a Nitro global error handler that catches all unhandled server errors and returns a normalized `INTERNAL_ERROR` response, preventing information leakage
- `public-news-api`: Add `Cache-Control` header requirements for all public `GET` news endpoints to improve CDN and browser cache behaviour

## Impact

- `server/plugins/error-handler.ts` — new Nitro plugin
- `app/error.vue` — new Nuxt error page
- `server/api/news/*.get.ts`, `server/api/categories/*.get.ts` — add `setResponseHeader` calls
- `test/unit/` — new test files for validators, mappers, sanitization
- No database changes, no API contract changes, no breaking changes
