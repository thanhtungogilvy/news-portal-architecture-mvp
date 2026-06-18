## Why

Users currently can only find articles through category browsing or exact-text search. Natural language search — "AI trong giáo dục", "chính sách kinh tế mới nhất" — is not possible. Semantic search allows users to find relevant articles by meaning, not keywords, significantly improving content discoverability.

## What Changes

- Add `search.repository.ts` — pgvector cosine similarity query against `article_embeddings`
- Add `semantic-search.service.ts` — embeds user query via LM Studio, queries pgvector, applies category filter, returns ranked results
- Add `GET /api/search` — accepts `q` (required) and `category` (optional) query params
- Add `app/pages/search.vue` — search results page with loading, empty, and error states
- Add `useSemanticSearch.ts` composable — manages search state, debouncing, and result pagination
- Add search input to public site header (or dedicated search bar on search page)
- Return HTTP 503 with clear message when LM Studio is unavailable

## Capabilities

### New Capabilities
- `semantic-search`: Natural language article search using query embedding + pgvector similarity, with category filter and similarity score in results

### Modified Capabilities
- `home-page`: Add search entry point in header or hero area (navigation to `/search`)
- `public-news-api`: New public search endpoint added alongside existing list/featured/most-viewed

## Impact

**New files:**
- `server/api/search.get.ts`
- `server/services/semantic-search.service.ts`
- `server/repositories/search.repository.ts`
- `app/pages/search.vue`
- `app/composables/search/useSemanticSearch.ts`

**Modified files:**
- `app/components/layout/LayoutHeader.vue` — add search icon/input linking to `/search`

**API contract:**
```
GET /api/search?q=<string>&category=<slug>

Response 200:
{
  data: Array<{
    id: string
    title: string
    slug: string
    summary: string | null
    thumbnailUrl: string | null
    category: string | null
    source: string | null
    score: number          // cosine similarity 0-1
  }>
}

Response 503: { error: "AI_UNAVAILABLE", message: "..." }
```

**Prerequisites:** Phase 8.1 (article-embeddings, lmstudio-provider) must be complete
