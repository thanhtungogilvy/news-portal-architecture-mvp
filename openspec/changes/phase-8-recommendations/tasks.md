## 1. Database Migration

- [ ] 1.1 Create `supabase/migrations/*_user_article_history.sql` — `user_article_history` table (`id`, `anonymous_session_id text`, `article_id uuid FK`, `viewed_at timestamptz`), index on `(anonymous_session_id, viewed_at)`, RLS: anon/authenticated insert allowed, service_role full access

## 2. Server — Repositories

- [ ] 2.1 Create `server/repositories/recommendation.repository.ts` — `findSimilarArticles(client, articleId, categoryId, queryEmbedding, limit)`, `findRelatedArticles(client, articleId, queryEmbedding, limit)`, `findArticlesByIds(client, ids)`, `findMostViewedFallback(client, excludeId?, categoryId?, limit)` 
- [ ] 2.2 Add `insertViewHistory(client, sessionId, articleId)` and `getRecentViewedEmbeddings(client, sessionId, limit)` to repository

## 3. Server — Recommendation Service

- [ ] 3.1 Create `server/services/recommendation.service.ts` — `rerank(candidates)` applying `sim*0.7 + recency*0.2 + views*0.1` with min-max normalization
- [ ] 3.2 Implement `getSimilarArticles(event, articleId)` — load article embedding, vector search same category, rerank, fallback to most-viewed on LM Studio error
- [ ] 3.3 Implement `getRelatedArticles(event, articleId)` — load article embedding, vector search all categories, rerank, fallback to most-viewed on LM Studio error
- [ ] 3.4 Implement `getPersonalizedRecommendations(event, sessionId)` — load last 10 viewed embeddings, average vectors, vector search excluding viewed, rerank; fallback if <2 history or LM Studio error

## 4. Server — API Endpoints

- [ ] 4.1 Create `server/api/news/[id]/similar.get.ts` — call `getSimilarArticles`, return `{ data: [...] }`
- [ ] 4.2 Create `server/api/news/[id]/related.get.ts` — call `getRelatedArticles`, return `{ data: [...] }`
- [ ] 4.3 Create `server/api/recommendations/for-you.get.ts` — validate `sessionId` query param, call `getPersonalizedRecommendations`, return `{ data: [...] }`
- [ ] 4.4 Create `server/api/news/[id]/history.post.ts` — validate `sessionId` in body, call `insertViewHistory`

## 5. Frontend — Composable & Session

- [ ] 5.1 Create `app/composables/useAnonymousSession.ts` — UUID generation, cookie persistence (SameSite=Lax, 365d), returns `sessionId` ref
- [ ] 5.2 Create `app/composables/news/useRecommendations.ts` — `useSimilar(articleId)`, `useRelated(articleId)`, `useForYou(sessionId)` — each returns `{ data, pending, error }` via `useFetch`

## 6. Frontend — UI Components

- [ ] 6.1 Create `app/components/news/SimilarArticles.vue` — section with heading + `NewsCard` grid, hidden when `data` is empty
- [ ] 6.2 Create `app/components/news/RelatedArticles.vue` — same structure, different heading
- [ ] 6.3 Create `app/components/news/PersonalizedArticles.vue` — "Có thể bạn quan tâm" section with `NewsCard` grid

## 7. Frontend — Page Integration

- [ ] 7.1 Mount `<SimilarArticles>` and `<RelatedArticles>` in `app/pages/news/[slug].vue` below article content; call `POST /api/news/:id/history` on mount with anonymous session ID
- [ ] 7.2 Mount `<PersonalizedArticles>` in `app/pages/index.vue`

## 8. Validation

- [ ] 8.1 Run `npm run lint` and fix any issues
- [ ] 8.2 Run `npm run typecheck` and fix any type errors
- [ ] 8.3 Smoke test: open article detail, verify Similar + Related sections render
- [ ] 8.4 Smoke test: visit several articles, go to home page, verify "Có thể bạn quan tâm" changes
- [ ] 8.5 Test fallback: stop LM Studio, verify recommendation sections show popular articles (not error)
