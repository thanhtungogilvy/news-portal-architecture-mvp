## Context

Phase 1 delivered all server API endpoints. The project now needs a public-facing UI so readers can browse and read news. The stack is Nuxt 4 (srcDir = `app/`), Vue 3 Composition API, Tailwind CSS, and Pinia. Data is fetched exclusively through the server API layer — no direct Supabase client calls from pages/composables.

## Goals / Non-Goals

**Goals:**
- Render the home page with featured and most-viewed news sections
- Render a category listing page with paginated news filtered by category
- Render a news detail page with full article content and automatic view count increment
- Provide a default layout with header, nav, and footer
- Reusable UI primitives (Button, Badge, Skeleton, Card) usable in later phases

**Non-Goals:**
- Authentication UI (Phase 4)
- Admin pages (Phase 3 & 4)
- Search functionality (Phase 5)
- Infinite scroll / load-more (first page only for MVP)
- SEO meta tags beyond basic Nuxt defaults

## Decisions

### D1: Data via `useFetch` composables, not direct Supabase
All data fetching goes through `/api/*` endpoints using `useFetch`. This gives SSR-compatible data, consistent error shape, and keeps RLS logic server-side.
- **Alternative**: `useSupabaseClient` directly from pages — rejected because it bypasses the service/repository layer and exposes DB schema to the client.

### D2: One composable per API resource group
- `useNewsList` — GET /api/news (paginated + optional category filter)
- `useFeaturedNews` — GET /api/news/featured
- `useMostViewedNews` — GET /api/news/most-viewed
- `useNewsDetail` — GET /api/news/:slug + POST /api/news/:id/view
- `useCategoryList` — GET /api/categories
Each composable returns `{ data, pending, error }` forwarding from `useFetch`.

### D3: Components follow 3-tier hierarchy
- `app/components/ui/` — generic, design-system primitives (UiButton, UiBadge, UiSkeleton, UiCard)
- `app/components/news/` — news-domain components (NewsCard, NewsList)
- `app/components/category/` — category-domain components (CategoryPill, CategoryNav)
- `app/components/layout/` — chrome (LayoutHeader, LayoutFooter)
Nuxt auto-imports all components; no manual registration needed.

### D4: Default layout wraps all public pages
`app/layouts/default.vue` provides LayoutHeader + `<slot />` + LayoutFooter. Pages set `definePageMeta({ layout: 'default' })` explicitly to make intent clear.

### D5: View count trigger on client-side mount
`useNewsDetail` fires `$fetch('POST /api/news/:id/view')` in `onMounted` (client only) to avoid incrementing during SSR. No retry on failure — view count is best-effort.

## Risks / Trade-offs

- [Hydration mismatch on skeleton states] → Use `v-if="pending"` consistently; skeletons render the same HTML server/client
- [View count fires on every page visit including bots] → Acceptable for MVP; can add bot detection in Phase 5
- [category filter requires slug→id resolution on server] → Already handled in `news.service.ts`; composable passes `?category=<slug>` as-is

## Open Questions

- None blocking implementation.
