## 1. Server — Search Service & Repository

- [x] 1.1 Create `server/repositories/search.repository.ts` — `searchByEmbedding(client, queryEmbedding, matchCount)` calling `match_article_embeddings` RPC, returns array of `{ article_id, similarity }`
- [x] 1.2 Create `server/services/semantic-search.service.ts` — `semanticSearch(event, query, categorySlug?)`: embed query via `lmstudio.provider`, call repository (top 50), join with article data, filter by category if provided, return top 10 with score

## 2. Server — Search API Endpoint

- [x] 2.1 Create `server/api/search.get.ts` — validate `q` (required, non-empty) and `category` (optional) with Zod, call `semanticSearch`, return results; catch LM Studio errors and return 503

## 3. Frontend — Composable

- [x] 3.1 Create `app/composables/search/useSemanticSearch.ts` — reactive `query`, `results`, `pending`, `error`; debounce 400ms; sync query to URL via `useRouter`; call `$fetch('/api/search')`

## 4. Frontend — Search Page

- [x] 4.1 Create `app/pages/search.vue` — search input bound to composable, results grid using `NewsCard`, loading skeleton, empty state, 503 error state
- [x] 4.2 Restore query from URL on page mount (so shared links work)

## 5. Frontend — Header Entry Point

- [x] 5.1 Add search icon button to `app/components/layout/LayoutHeader.vue` that navigates to `/search`

## 6. Validation

- [x] 6.1 Run `npm run lint` and fix any issues
- [x] 6.2 Run `npm run typecheck` and fix any type errors
- [x] 6.3 Manual smoke test: search for a Vietnamese phrase, verify ranked results appear
- [x] 6.4 Test category filter: search with `?category=<slug>`, verify only that category's articles in results
- [x] 6.5 Test 503: stop LM Studio, verify search page shows error state (not crash)
