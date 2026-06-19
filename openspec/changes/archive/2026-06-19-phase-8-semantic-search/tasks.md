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

## 7. Post-implementation improvements

- [x] 7.1 Add `rawScore` field to `SearchResult` type; normalize `score` so top result = 1.0 in `semantic-search.service.ts`
- [x] 7.2 Add debug mode (`?debug=1`) to `search.vue` showing raw/normalized score breakdown table per result
- [x] 7.3 SQL migration: add `min_similarity` param to `match_article_embeddings` RPC; make `match_count` DEFAULT NULL (no hard limit) — filters at SQL level instead of top-K in service layer (`supabase/migrations/20260619000001_update_match_article_embeddings_min_similarity.sql`)
- [x] 7.4 SQL migration: resize `article_embeddings.embedding` column from `vector(768)` to `vector(1024)` to support BGE-M3 model; truncate old embeddings; reset all embedding_jobs to pending (`supabase/migrations/20260619100000_resize_embedding_vector_1024.sql`)
- [x] 7.5 SQL migration: replace IVFFlat index with HNSW index to fix zero-results bug caused by centroids built on empty table (`supabase/migrations/20260619110000_fix_embedding_index_ivfflat_to_hnsw.sql`)
- [x] 7.6 Increase embedding text content cap from 500 → 2000 chars in `embedding.service.ts`; reset embedding_jobs to re-embed with more content
- [x] 7.7 Fix debounce over-fetching: change `useAsyncData` key to static (no reactive deps), add `commitSearch()` for URL sync, debounce 400ms → 600ms — one API call per idle period, not per keystroke
- [x] 7.8 Create `scripts/check-embeddings.ts` monitoring script; add `npm run embeddings:check` and `npm run embeddings:watch` to `package.json`
- [x] 7.9 Create `server/api/internal/debug/embeddings.get.ts` debug endpoint for embedding coverage stats
