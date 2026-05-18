## Why

Home page chỉ hiển thị 6 featured + 6 most-viewed. Không có chỗ để người dùng browse toàn bộ bài viết hoặc lọc theo category. `/categories/[slug]` tồn tại nhưng chỉ đến được qua CategoryPill — không có entry point "xem tất cả".

## What Changes

- Thêm `/news` page: hiển thị toàn bộ bài đã published, pagination, filter category inline qua query param `?category=<slug>`
- Update `CategoryPill` link từ `/categories/<slug>` → `/news?category=<slug>`; active state detect qua `route.query.category`
- Update `LayoutHeader` nav: thêm link "Tin tức" → `/news`
- `/categories/[slug]` giữ nguyên (không xóa, vẫn hoạt động độc lập)

## Capabilities

### New Capabilities
- `news-hub-page`: `/news` listing page với pagination + category filter qua query param

### Modified Capabilities
- `category-page`: `CategoryPill` link target thay đổi từ `/categories/[slug]` sang `/news?category=[slug]`

## Impact

- `app/pages/news/index.vue` — file mới
- `app/components/category/CategoryPill.vue` — update link + active state logic
- `app/components/layout/LayoutHeader.vue` — thêm nav link
- Không có API change, không có DB change
