## Context

After reading an article, users have no path to discover related content. Phase 8.1 provides article embeddings. This phase uses those embeddings to surface three types of recommendations: same-category similar articles, cross-category related articles, and personalized suggestions based on anonymous reading history.

**Current state:** News detail page (`app/pages/news/[slug].vue`) has no recommendation sections. Home page has featured/most-viewed but no personalized section. No reading history is tracked.

**Constraints:**
- Public readers do not log in — personalization must use anonymous session ID (cookie)
- Recommendation endpoints must fallback to latest/most-viewed when LM Studio is unavailable (not 503)
- Re-ranking formula: `semantic_similarity * 0.7 + recency_boost * 0.2 + view_count_boost * 0.1`

## Goals / Non-Goals

**Goals:**
- `GET /api/news/:id/similar` — same-category, semantically similar, re-ranked
- `GET /api/news/:id/related` — cross-category, semantically similar, re-ranked
- `GET /api/recommendations/for-you` — personalized via anonymous session; fallback to most-viewed
- `POST /api/news/:id/history` — record article view for session
- `useAnonymousSession` composable — UUID cookie generation/persistence
- UI sections on news detail and home page

**Non-Goals:**
- Logged-in user personalization
- Collaborative filtering (user-user or item-item CF)
- Admin personalization controls
- A/B testing recommendation variants

## Decisions

### Decision 1 — Anonymous session via cookie (not localStorage)

**Choice:** `useAnonymousSession` generates a UUID and stores it in a cookie (SameSite=Lax, 365d expiry). Session ID is sent to server via cookie header or explicit query param.

**Rationale:** Cookie works with SSR — server can read session ID on initial render. localStorage is not available during SSR. Cookie is the idiomatic Nuxt approach.

### Decision 2 — User profile vector = average of recent 10 article embeddings

**Choice:** `GET /api/recommendations/for-you?sessionId=<id>` loads the last 10 viewed article embeddings from `user_article_history`, averages the vectors component-wise, then runs pgvector similarity search excluding already-viewed articles.

**Rationale:** Simple to implement, reasonable semantic signal for a POC. No ML model needed.

**Threshold:** If session has fewer than 2 viewed articles, skip vector search and return fallback (most-viewed).

### Decision 3 — Re-ranking in application layer

**Choice:** After pgvector returns top candidates, service applies: `score = sim*0.7 + recency*0.2 + views*0.1` where recency and views are min-max normalized across the candidate set.

**Rationale:** Keeps the RPC function simple (unchanged). Re-ranking logic is easy to tune without DB migrations.

### Decision 4 — Fallback for unavailable LM Studio

**Choice:** Similar/Related endpoints: if LM Studio unavailable, return most-viewed articles in same/all category excluding current. For-you: return most-viewed articles.

**Rationale:** Recommendations are a UX enhancement — degrading to popular articles is far better than returning an error. Search and chatbot are query-driven (user has explicit intent) so they return 503; recommendations are ambient so fallback is appropriate.

### Decision 5 — History tracking decoupled from view count

**Choice:** `POST /api/news/:id/history` is a separate endpoint from `POST /api/news/:id/view`. History is called client-side from the news detail page composable alongside the view count call.

**Rationale:** View count is already queued through a background job; history is a direct insert (lightweight). Keeps concerns separate.

## Risks / Trade-offs

**[Risk] Anonymous session ID collision**
→ Mitigation: UUID v4 has negligible collision probability. Acceptable.

**[Risk] Large `user_article_history` table over time**
→ Mitigation: Query only last 10 entries per session. Table can be pruned by a cron job in future. No immediate concern for POC.

**[Trade-off] Profile vector is a crude average**
→ For POC this is sufficient. A weighted average (recency-weighted) could improve quality but adds complexity not needed for demo.

## Migration Plan

1. Phase 8.1 must be complete
2. Apply `user_article_history` migration
3. Deploy recommendation API endpoints
4. Deploy UI sections
5. No existing API changes (additive only)

## Open Questions

- None.
