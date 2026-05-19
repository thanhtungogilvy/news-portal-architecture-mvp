## 1. Error Page

- [x] 1.1 Create `app/error.vue`: accept `error` prop (`useError()`) and render a "Page not found" message when `error.statusCode === 404`, or "Something went wrong" for all other codes
- [x] 1.2 Add a "Go home" button that calls `clearError({ redirect: '/' })`
- [x] 1.3 Apply `layout: 'default'` via `definePageMeta` so the header/footer render around the error content

## 2. Nitro Global Error Handler

- [x] 2.1 Create `server/plugins/error-handler.ts` using `defineNitroPlugin`; register an `onError` hook that inspects each unhandled error
- [x] 2.2 In the hook: if `isH3Error(error)` and the error already has a well-formed `data.error.code`, pass it through unchanged; otherwise log the original error via `console.error` and re-wrap as `{ statusCode: 500, data: { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } } }`

## 3. Cache-Control Headers (public GET endpoints)

- [x] 3.1 Add `setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')` to `server/api/news/index.get.ts` before the `return`
- [x] 3.2 Add the same header to `server/api/news/featured.get.ts`
- [x] 3.3 Add the same header to `server/api/news/most-viewed.get.ts`
- [x] 3.4 Add the same header to `server/api/news/[slug].get.ts` (only when article is found, before return)

## 4. Extract Sanitize Utility

- [x] 4.1 Move the `sanitize()` function from `app/pages/news/[slug].vue` to `app/utils/sanitize/html.ts` as a named export `sanitizeHtml(html: string): string`; keep all DOMPurify config (`ALLOWED_TAGS`, `ALLOWED_ATTR`, `ALLOWED_URI_REGEXP`) inside the util
- [x] 4.2 Update `app/pages/news/[slug].vue` to import and call `sanitizeHtml` instead of the inline function

## 5. Unit Tests

- [x] 5.1 Add a `jsdom` vitest project to `vitest.config.mts`: `{ test: { name: 'dom', include: ['test/dom/**/*.dom.spec.ts'], environment: 'jsdom' } }`
- [x] 5.2 Create `test/unit/news-validators.test.ts`: test `newsCreateSchema` (valid input, missing title, invalid slug format, invalid URL) and `newsListQuerySchema` (defaults, coercion, page=0 rejection)
- [x] 5.3 Create `test/unit/category-validators.test.ts`: test `categoryCreateSchema` (valid input, too-long name, invalid slug characters)
- [x] 5.4 Create `test/unit/news-mapper.test.ts`: test `mapNews` with a minimal DB row (no category) and with a category object; assert all DTO fields are correctly mapped
- [x] 5.5 Create `test/unit/category-mapper.test.ts`: test `mapCategory` with a DB row; assert all DTO fields are correctly mapped
- [x] 5.6 Create `test/dom/sanitize.dom.spec.ts` (jsdom env): test `sanitizeHtml` — safe tags pass through, `<script>` stripped, `onclick` stripped, `data:` URIs stripped, plain text unaffected

## 6. Validation

- [x] 6.1 Run `npm run typecheck` — must pass with no new errors
- [x] 6.2 Run `npm run lint` — must pass clean
- [x] 6.3 Run `npm run test` — all test suites (unit + nuxt + dom) must pass
