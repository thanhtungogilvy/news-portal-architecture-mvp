## Context

Phase 2 đã có `useNewsList` composable hỗ trợ `{ page, limit, category }` và `/api/news` endpoint đã nhận `?category=slug`. Thiếu duy nhất page `/news` và update CategoryPill.

## Goals / Non-Goals

**Goals:**
- `/news` hiển thị tất cả published news, paginated, filterable by category
- Category filter dùng URL query param (`?category=`) để SEO-friendly và shareable
- CategoryPill active state phản ánh query param thay vì route segment

**Non-Goals:**
- Không xóa `/categories/[slug]`
- Không thêm search/sort
- Không thay đổi API

## Decisions

**Query param thay vì route segment cho category filter:**
- `/news?category=the-thao` vs `/news/the-thao`
- Chọn query param vì: "All" state (`/news`) không cần slug placeholder, dễ reset filter hơn, consistent với pattern phổ biến của news sites

**Reuse `useNewsList` hoàn toàn:**
- Composable đã nhận `MaybeRef<NewsListQuery>` với `{ category, page, limit }`
- Page chỉ cần bind `route.query.category` và `route.query.page` vào composable

**CategoryPill cập nhật link target:**
- Link to `/news?category=[slug]` thay vì `/categories/[slug]`
- Active khi `route.path === '/news' && route.query.category === slug`
- "All" pill: active khi `route.path === '/news' && !route.query.category`

## Risks / Trade-offs

- `/categories/[slug]` vẫn accessible trực tiếp — CategoryPill không còn link tới nhưng URL cũ vẫn hoạt động. Không có redirect nên old bookmarks vẫn work.
- `page` reset về 1 khi đổi category — cần `watch(category, () => page = 1)`.
