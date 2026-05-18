## 1. News Hub Page

- [x] 1.1 Tạo `app/pages/news/index.vue` — `/news` hub: CategoryNav + NewsList + pagination, filter bằng `?category=` query param, reset page về 1 khi đổi category
- [x] 1.2 Verify: `npm run typecheck && npm run lint` pass

## 2. Update CategoryPill

- [x] 2.1 Update `app/components/category/CategoryPill.vue` — link target → `/news?category=<slug>`; active state → `route.path === '/news' && route.query.category === slug`
- [x] 2.2 Thêm "All" pill vào `app/components/category/CategoryNav.vue` — link → `/news`, active khi `route.path === '/news' && !route.query.category`
- [x] 2.3 Verify: `npm run typecheck && npm run lint` pass

## 3. Update LayoutHeader

- [x] 3.1 Update `app/components/layout/LayoutHeader.vue` — thêm nav link "Tin tức" → `/news`
- [x] 3.2 Verify: `npm run typecheck && npm run lint` pass
