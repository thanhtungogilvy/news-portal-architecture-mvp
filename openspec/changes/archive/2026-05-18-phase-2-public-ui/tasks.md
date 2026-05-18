## 1. UI Primitives

- [x] 1.1 Tạo `app/components/ui/UiButton.vue` — variant (primary/secondary/ghost), size (sm/md/lg), disabled state
- [x] 1.2 Tạo `app/components/ui/UiBadge.vue` — color (default/primary/success/warning), slot content
- [x] 1.3 Tạo `app/components/ui/UiSkeleton.vue` — animated pulse placeholder, passthrough class
- [x] 1.4 Tạo `app/components/ui/UiCard.vue` — styled container with default slot
- [x] 1.5 Verify: `npm run typecheck && npm run lint` pass

## 2. Layout Components

- [x] 2.1 Tạo `app/components/layout/LayoutHeader.vue` — site title/logo + nav links
- [x] 2.2 Tạo `app/components/layout/LayoutFooter.vue` — footer with copyright
- [x] 2.3 Tạo `app/layouts/default.vue` — LayoutHeader + `<slot />` + LayoutFooter
- [x] 2.4 Verify: `npm run typecheck && npm run lint` pass

## 3. Category Components & Composable

- [x] 3.1 Tạo `app/composables/category/useCategoryList.ts` — `useFetch('/api/categories')`, trả `{ categories, pending, error }`
- [x] 3.2 Tạo `app/components/category/CategoryPill.vue` — NuxtLink pill cho một category, active styles khi route khớp
- [x] 3.3 Tạo `app/components/category/CategoryNav.vue` — dùng `useCategoryList`, render danh sách CategoryPill
- [x] 3.4 Verify: `npm run typecheck && npm run lint` pass

## 4. News Components & Composables

- [x] 4.1 Tạo `app/composables/news/useFeaturedNews.ts` — `useFetch('/api/news/featured')`, trả `{ news, pending, error }`
- [x] 4.2 Tạo `app/composables/news/useMostViewedNews.ts` — `useFetch('/api/news/most-viewed')`, trả `{ news, pending, error }`
- [x] 4.3 Tạo `app/composables/news/useNewsList.ts` — `useFetch('/api/news', { query })`, trả `{ news, total, pending, error }`
- [x] 4.4 Tạo `app/composables/news/useNewsDetail.ts` — `useFetch('/api/news/:slug')` + `$fetch POST /api/news/:id/view` trên client mount
- [x] 4.5 Tạo `app/components/news/NewsCard.vue` — hiển thị thumbnail, title, category badge, published date
- [x] 4.6 Tạo `app/components/news/NewsCardSkeleton.vue` — UiSkeleton placeholders theo layout của NewsCard
- [x] 4.7 Tạo `app/components/news/NewsList.vue` — nhận `items` + `pending`, render NewsCard hoặc NewsCardSkeleton
- [x] 4.8 Verify: `npm run typecheck && npm run lint` pass

## 5. Pages

- [x] 5.1 Tạo `app/pages/index.vue` — home page: featured section + most-viewed section, layout='default'
- [x] 5.2 Tạo `app/pages/categories/[slug].vue` — category listing page: CategoryNav + NewsList + pagination, layout='default'
- [x] 5.3 Tạo `app/pages/news/[slug].vue` — news detail page: full article + view count trigger on mount, layout='default'
- [x] 5.4 Verify: `npm run typecheck && npm run lint` pass
