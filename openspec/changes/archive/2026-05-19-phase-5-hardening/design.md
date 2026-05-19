## Context

The application has completed four phases of development and has a full-featured admin and public surface. The underlying contracts (API envelope, error codes, Zod validators, mappers) are stable. What's missing is the defensive layer: the server can leak raw Supabase error strings on unexpected failures; the client has no fallback UI for navigation errors; public endpoints bypass HTTP caching; and there are no tests for the cross-cutting security functions (validators, mappers, HTML sanitization).

## Goals / Non-Goals

**Goals:**
- Prevent internal server errors from leaking raw Supabase or runtime messages to API consumers
- Give users a friendly recovery surface when Nuxt catches a 404 or 500
- Enable HTTP caching on public read endpoints to reduce Supabase load
- Raise test confidence on the three security/data-integrity boundaries: input validation, data mapping, and HTML sanitization

**Non-Goals:**
- Rewriting or replacing existing validators, mappers, or sanitization logic
- Adding rate limiting or CSP headers (separate hardening concern)
- Integration / end-to-end tests (unit tests only in this phase)
- Modifying the Supabase RLS policies

## Decisions

### 1. Nitro `onError` plugin instead of per-handler try/catch

**Decision**: Add a single `server/plugins/error-handler.ts` using Nitro's `onError` hook to normalize any unhandled `H3Error` or generic `Error` into the standard `{ error: { code, message } }` shape.

**Rationale**: Placing error normalization in one Nitro plugin means every future handler gets it for free; per-handler try/catch would need to be replicated 20+ times and would inevitably be missed.

**Alternative considered**: A custom `sendError` wrapper exported from `server/utils/`. Rejected because it still requires each handler to opt in.

### 2. `app/error.vue` as the error boundary

**Decision**: Create `app/error.vue` as the standard Nuxt error page. It receives the `error` prop from Nuxt's error boundary and displays a message appropriate to `error.statusCode` (404 vs. others).

**Rationale**: Nuxt automatically uses `app/error.vue` for both server-side render errors and client-side navigation errors. No extra plugin needed.

**Alternative considered**: A dedicated `/error` route page. Rejected because Nuxt's built-in error boundary is more complete and handles SSR errors.

### 3. `setResponseHeader` for Cache-Control (per handler)

**Decision**: Add `setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')` in each public `GET` handler rather than a Nitro middleware.

**Rationale**: Granular per-endpoint control lets detail endpoints (`:slug`) use a shorter TTL than list endpoints if needed in future. A blanket middleware would be harder to tune later.

**Alternative considered**: Nitro route rules in `nuxt.config.ts`. Viable but less explicit and harder to see in code review.

### 4. Test scope: unit tests only (Vitest)

**Decision**: Add unit tests in `test/unit/` for validators, mappers, and the sanitize helper. No new Nuxt runtime (`@nuxt/test-utils`) tests in this phase.

**Rationale**: Validators and mappers are pure functions — vitest unit tests run fast and need no Nuxt bootstrap. The sanitize helper uses DOMPurify with `jsdom` as the environment.

**Alternative considered**: Adding Nuxt integration tests for the API handlers. Deferred — higher value in later phases after the test infrastructure matures.

## Risks / Trade-offs

- **Cache-Control on admin endpoints**: Admin `GET` endpoints MUST NOT receive public cache headers; the change is scoped to `server/api/news/*.get.ts` and `server/api/categories/*.get.ts` (public only).
- **Nitro `onError` double-wrapping**: If a handler already throws a well-formed `H3Error` (e.g., from `createApiError`), the plugin must pass it through unchanged. Only unknown `Error` objects should be re-wrapped. → Mitigation: check `isH3Error(error)` before wrapping.
- **DOMPurify in jsdom**: `sanitize()` in `app/pages/news/[slug].vue` has an SSR guard (`if (typeof window === 'undefined') return html`). The test must run in a `jsdom` environment to exercise the full sanitization path.
