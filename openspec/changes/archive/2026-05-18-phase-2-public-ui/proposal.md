## Why

Phase 1 delivered the public API layer. Phase 2 delivers the user-facing UI so readers can actually browse and read the news portal — without a frontend, the API has no value.

## What Changes

- New: `app/components/ui/` — reusable primitive components (Button, Badge, Skeleton, Card)
- New: `app/components/layout/` — LayoutHeader, LayoutFooter, LayoutNav
- New: `app/components/news/` — NewsCard, NewsCardSkeleton, NewsList
- New: `app/components/category/` — CategoryPill, CategoryNav
- New: `app/composables/news/useNewsList.ts` — fetches paginated news from GET /api/news
- New: `app/composables/news/useFeaturedNews.ts` — fetches from GET /api/news/featured
- New: `app/composables/news/useMostViewedNews.ts` — fetches from GET /api/news/most-viewed
- New: `app/composables/news/useNewsDetail.ts` — fetches single article + triggers view count
- New: `app/composables/category/useCategoryList.ts` — fetches from GET /api/categories
- New: `app/layouts/default.vue` — layout with header + footer
- New: `app/pages/index.vue` — home page (featured + most-viewed sections)
- New: `app/pages/categories/[slug].vue` — category listing page
- New: `app/pages/news/[slug].vue` — news detail page

## Capabilities

### New Capabilities

- `ui-primitives`: Reusable UI components: UiButton, UiBadge, UiSkeleton, UiCard
- `home-page`: Home page showing featured news and most-viewed news sections
- `category-page`: Category listing page with paginated news filtered by category slug
- `news-detail-page`: News article detail page that fetches article and fires view count

### Modified Capabilities

<!-- No existing spec-level requirements change in Phase 2 -->

## Impact

- `app/components/ui/`, `app/components/layout/`, `app/components/news/`, `app/components/category/` — new directories
- `app/composables/news/`, `app/composables/category/` — new composables
- `app/layouts/default.vue`, `app/pages/index.vue`, `app/pages/categories/[slug].vue`, `app/pages/news/[slug].vue` — new pages
- Runtime dependency on Phase 1 API endpoints (GET /api/news/*, GET /api/categories/*)
- No database schema changes
- No API changes
