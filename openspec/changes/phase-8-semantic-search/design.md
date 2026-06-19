## Context

The news portal has no search feature. Users can only browse articles by category or scroll the home page. Phase 8.1 provides article embeddings in pgvector. This design covers how to expose those embeddings as a natural-language search endpoint and search UI.

**Current state:** No `/api/search`, no search page. `article_embeddings` table and `match_article_embeddings` RPC are provided by Phase 8.1.

**Constraints:**
- Must not call LM Studio from the browser
- Must return 503 when LM Studio is unavailable (not 500, not empty results)
- Category filter must work with semantic results (post-filter, not pre-filter)

## Goals / Non-Goals

**Goals:**
- `GET /api/search?q=<text>&category=<slug>` returns semantically ranked article cards with similarity score
- Search page at `/search` with loading, empty, and error states
- Search entry point in the public site header

**Non-Goals:**
- Full-text fallback search when LM Studio is down
- Search result pagination (first N results only for POC)
- Search history / saved searches
- Admin search

## Decisions

### Decision 1 — Embed query server-side, query pgvector

**Choice:** Server receives `q` string → calls `lmstudio.provider.ts embed(q)` → calls `match_article_embeddings` RPC → returns ranked results.

**Rationale:** Keeps LM Studio calls server-side. The RPC already exists from Phase 8.1. No extra infrastructure needed.

### Decision 2 — Category filter as SQL-level min_similarity filter (revised)

**Original choice:** Fetch top-50 from pgvector, post-filter by category in service layer.

**Revised choice (implemented):** Added `min_similarity` parameter to `match_article_embeddings` RPC so filtering happens at SQL level. `match_count` defaults to NULL (no hard limit). Service layer slices to `MAX_RESULTS=10` after fetching.

**Rationale for revision:** Post-filter with a hard top-50 could return fewer than 10 results after category filtering. SQL-level `min_similarity` (0.40) eliminates irrelevant results at the DB layer and is more efficient. Category post-filter is kept in the service layer for simplicity.

**Migration:** `supabase/migrations/20260619000001_update_match_article_embeddings_min_similarity.sql`

### Decision 3 — Return both normalized score and raw similarity score

**Choice:** Include `score: number` (normalized so top result = 1.0) and `rawScore: number` (raw cosine similarity from pgvector) in each result item.

**Rationale:** Raw cosine similarity for short queries vs long articles is typically 0.40–0.65 regardless of relevance — not intuitive for users. Normalizing makes the UI score meaningful (top = 100%). `rawScore` retained for debugging via `?debug=1` mode.

### Decision 4 — useSemanticSearch composable with debounce and explicit commit

**Choice:** Composable manages `query`, `results`, `pending`, `error` state. Typing is debounced 600ms before API call. URL sync (`/search?q=...`) only happens on explicit commit (Enter key or search button click) via `commitSearch()`. `useAsyncData` uses a static key to prevent auto-refetch on keystroke.

**Rationale:** Standard UX pattern. Separating debounced search from URL sync prevents the URL from changing while the user is still typing. Static `useAsyncData` key prevents Nuxt from re-fetching on every reactive dep change (which caused per-keystroke API calls).

## Risks / Trade-offs

**[Risk] LM Studio cold start latency**
→ Mitigation: Show loading spinner. First search after LM Studio restart may take 3–5s. Document as known behavior.

**[Risk] Category post-filter returns fewer than expected results**
→ Mitigation: Over-fetch (top 50 from vector search) before filtering. Acceptable for POC.

**[Trade-off] No full-text fallback**
→ When LM Studio is down, search returns 503. Users see error state. Acceptable for local POC — document as known limitation.

### Decision 5 — HNSW index instead of IVFFlat

**Choice:** Use `USING hnsw (embedding vector_cosine_ops)` with `m=16, ef_construction=64`.

**Rationale:** IVFFlat computes centroids at index creation time. When the table was truncated (to resize from vector(768) to vector(1024)), the IVFFlat index was rebuilt on an empty table producing garbage centroids — all queries returned 0 results. HNSW builds its graph incrementally and works correctly regardless of when it is created or whether the table was empty. HNSW also has better recall at small scale (~300 articles).

### Decision 6 — BGE-M3 (1024-dim) as embedding model

**Choice:** Use `gpustack/bge-m3-GGUF` via LM Studio (1024-dim output).

**Rationale:** Previous model (`embeddinggemma-300m-qat-GGUF`, 768-dim) was primarily English-pretrained, producing poor semantic alignment for Vietnamese text. BGE-M3 is trained on 100+ languages including Vietnamese with multi-granularity embeddings (word, sentence, passage level), giving meaningfully higher raw cosine similarity for Vietnamese queries.

**Migration required:** Column type change from `vector(768)` to `vector(1024)`, truncate old embeddings, reset all `embedding_jobs` to `pending`.

## Migration Plan (revised)

1. Phase 8.1 must be complete (`article_embeddings` populated, `match_article_embeddings` RPC exists)
2. Deploy `GET /api/search`
3. Deploy search page and header entry point
4. Apply `20260619000001_update_match_article_embeddings_min_similarity.sql` — add `min_similarity` param
5. Switch LM Studio model to `gpustack/bge-m3-GGUF` (1024-dim)
6. Apply `20260619100000_resize_embedding_vector_1024.sql` — resize column to vector(1024), reset jobs
7. Apply `20260619110000_fix_embedding_index_ivfflat_to_hnsw.sql` — HNSW index
8. Run `npm run worker:embedding` to re-embed all articles with new model
9. Monitor with `npm run embeddings:watch`

## Open Questions

- None.
