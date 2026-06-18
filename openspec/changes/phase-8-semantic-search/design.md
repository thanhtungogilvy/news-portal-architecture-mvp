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

### Decision 2 — Category filter as post-filter on pgvector results

**Choice:** Fetch top-K results from pgvector (e.g., top 50), then filter by category slug in application layer, return top 10 matching.

**Rationale:** pgvector's `match_article_embeddings` RPC can accept a filter param but joining on category slug requires a sub-select. Simpler to over-fetch and filter in service layer for POC. Avoids modifying the shared RPC function.

**Alternative rejected:** Pre-filter by `category_id` before vector search — requires passing category_id into the RPC which adds complexity to a shared function used by other features.

### Decision 3 — Return similarity score in response

**Choice:** Include `score: number` (cosine similarity 0–1) in each result item.

**Rationale:** Useful for demo/debugging and allows frontend to show relevance indicator if desired. Easy to strip later.

### Decision 4 — useSemanticSearch composable with debounce

**Choice:** Composable manages `query`, `results`, `pending`, `error` state. Input debounced 400ms before API call. URL-synced via `useRoute`/`useRouter` so search query is shareable.

**Rationale:** Standard UX pattern. URL sync means users can share search links.

## Risks / Trade-offs

**[Risk] LM Studio cold start latency**
→ Mitigation: Show loading spinner. First search after LM Studio restart may take 3–5s. Document as known behavior.

**[Risk] Category post-filter returns fewer than expected results**
→ Mitigation: Over-fetch (top 50 from vector search) before filtering. Acceptable for POC.

**[Trade-off] No full-text fallback**
→ When LM Studio is down, search returns 503. Users see error state. Acceptable for local POC — document as known limitation.

## Migration Plan

1. Phase 8.1 must be complete (`article_embeddings` populated, `match_article_embeddings` RPC exists)
2. Deploy `GET /api/search`
3. Deploy search page and header entry point
4. No DB migrations needed for this phase

## Open Questions

- None.
