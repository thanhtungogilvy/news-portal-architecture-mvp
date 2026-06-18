## Why

After reading an article, users have no path to discover related content. Recommendation sections — similar articles in the same category, related articles across all categories, and personalized suggestions based on reading history — increase time-on-site and improve content engagement. These are powered by the article embeddings from Phase 8.1.

## What Changes

- Add `recommendation.repository.ts` — pgvector similarity queries for similar/related/personalized articles
- Add `recommendation.service.ts` — re-ranking logic using `semantic_similarity + recency_boost + view_count_boost`
- Add `GET /api/news/[id]/similar` — same-category semantic similarity, excludes current article
- Add `GET /api/news/[id]/related` — cross-category semantic similarity, excludes current article
- Add `GET /api/recommendations/for-you` — personalized from anonymous session reading history; fallback to most-viewed if insufficient history
- Add `POST /api/news/[id]/history` — record article view for anonymous session
- Add `user_article_history` table — tracks `(anonymous_session_id, article_id, viewed_at)`
- Add `useAnonymousSession` composable — generates and persists UUID session ID in cookie
- Add `SimilarArticles.vue`, `RelatedArticles.vue`, `PersonalizedArticles.vue` UI components
- Mount recommendation sections on `app/pages/news/[slug].vue` and `app/pages/index.vue`
- Recommendation endpoints fallback to latest/most-viewed when LM Studio is unavailable

## Capabilities

### New Capabilities
- `article-recommendations`: Three recommendation modes (similar, related, personalized) powered by pgvector similarity and re-ranking
- `user-reading-history`: Anonymous session-based article view tracking used as personalization signal

### Modified Capabilities
- `news-detail-page`: Add Similar Articles and Related Articles sections below article content
- `home-page`: Add "Articles You May Like" personalized section

## Impact

**New files:**
- `supabase/migrations/*_user_article_history.sql`
- `server/api/news/[id]/similar.get.ts`
- `server/api/news/[id]/related.get.ts`
- `server/api/recommendations/for-you.get.ts`
- `server/api/news/[id]/history.post.ts`
- `server/services/recommendation.service.ts`
- `server/repositories/recommendation.repository.ts`
- `app/components/news/SimilarArticles.vue`
- `app/components/news/RelatedArticles.vue`
- `app/components/news/PersonalizedArticles.vue`
- `app/composables/news/useRecommendations.ts`
- `app/composables/useAnonymousSession.ts`

**Modified files:**
- `app/pages/news/[slug].vue` — mount Similar + Related sections
- `app/pages/index.vue` — mount Personalized section
- `server/api/news/[id]/view.post.ts` — also call history endpoint (or handle inline)

**Re-ranking formula:**
```
final_score = semantic_similarity * 0.7
            + recency_boost * 0.2        // normalized by days since publish
            + view_count_boost * 0.1     // normalized log scale
```

**Prerequisites:** Phase 8.1 (article-embeddings) must be complete
