## 1. Category Repository & Service

- [x] 1.1 Tạo `server/repositories/category.repository.ts` — `findAll()`, `findBySlug(slug)`
- [x] 1.2 Tạo `server/services/category.service.ts` — `listCategories()`, `getCategoryBySlug(slug)`

## 2. Category API Endpoints

- [x] 2.1 Tạo `server/api/categories/index.get.ts` — GET /api/categories
- [x] 2.2 Tạo `server/api/categories/[slug].get.ts` — GET /api/categories/:slug
- [x] 2.3 Verify: `npm run typecheck && npm run lint` pass

## 3. News Repository & Service

- [x] 3.1 Tạo `app/utils/validators/news.ts` — Zod schema cho query params (page, limit, category)
- [x] 3.2 Tạo `server/repositories/news.repository.ts` — `findPublished(opts)`, `findFeatured(limit)`, `findMostViewed(limit)`, `findBySlug(slug)`, `incrementViewCount(id)`
- [x] 3.3 Tạo `server/services/news.service.ts` — `listNews(query)`, `getFeaturedNews()`, `getMostViewedNews()`, `getNewsBySlug(slug)`, `recordView(id)`

## 4. News API Endpoints

- [x] 4.1 Tạo `server/api/news/index.get.ts` — GET /api/news (paginated, optional category filter)
- [x] 4.2 Tạo `server/api/news/featured.get.ts` — GET /api/news/featured
- [x] 4.3 Tạo `server/api/news/most-viewed.get.ts` — GET /api/news/most-viewed
- [x] 4.4 Tạo `server/api/news/[slug].get.ts` — GET /api/news/:slug
- [x] 4.5 Tạo `server/api/news/[id]/view.post.ts` — POST /api/news/:id/view
- [x] 4.6 Verify: `npm run typecheck && npm run lint` pass
