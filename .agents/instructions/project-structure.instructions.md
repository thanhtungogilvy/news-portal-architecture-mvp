---
applyTo: "**"
---

# Project Structure — News Portal MVP

Nuxt 4 — source app nằm trong `app/`, server nằm trong `server/`, config ở root.

## Domains trong project này

| Domain | Mô tả |
|--------|-------|
| `news` | Bài viết: public read, admin CRUD |
| `category` | Danh mục: public read, admin CRUD |
| `auth` | Login/logout, session, route guard |
| `admin` | Admin panel shell, layout, navigation |
| `layout` | Public site header, footer, nav |

## Folder Ownership

| Folder | Owns |
|--------|------|
| `app/pages/` | Route definition, route meta, middleware, screen-level orchestration |
| `app/pages/admin/` | Admin panel routes: login, categories, news |
| `app/layouts/` | `default.vue` (public), `admin.vue` (admin panel) |
| `app/components/ui/` | UI primitives — không chứa domain logic |
| `app/components/layout/` | Public site shell: `LayoutHeader.vue`, `LayoutFooter.vue`, `LayoutNav.vue` |
| `app/components/news/` | `NewsCard.vue`, `NewsDetailBody.vue`, `NewsPrevNextNav.vue`, `NewsHero.vue` |
| `app/components/category/` | `CategorySectionHeader.vue`, `CategoryCard.vue` |
| `app/components/admin/` | `AdminNewsTable.vue`, `AdminNewsForm.vue`, `AdminCategoryTable.vue`, `AdminCategoryForm.vue` |
| `app/components/auth/` | `AuthLoginForm.vue` |
| `app/composables/news/` | `useFeaturedNews.ts`, `useMostViewedNews.ts`, `useNewsList.ts`, `useNewsDetail.ts` |
| `app/composables/categories/` | `useCategoryList.ts`, `useCategoryDetail.ts` |
| `app/composables/admin/` | `useAdminNews.ts`, `useAdminCategories.ts` |
| `app/composables/auth/` | `useAuth.ts`, `useRequireAuth.ts` |
| `app/stores/` | `auth.ts` — session, user, isAuthenticated |
| `app/middleware/` | `auth.ts` (guard admin routes), `guest.ts` (redirect logged-in user) |
| `app/types/` | `news.ts`, `category.ts`, `auth.ts`, `api.ts` |
| `app/utils/validators/` | `news.ts`, `category.ts` — Zod schemas dùng chung client + server |
| `app/utils/constants/` | `news.ts` (status, etc.), `category.ts` |
| `app/utils/mappers/` | `news.ts`, `category.ts` — DB row → app DTO |
| `app/utils/format/` | `date.ts`, `content.ts` |
| `app/assets/icons/` | SVG icons — tự động import qua nuxt-svgo |
| `server/api/news/` | Public news endpoints |
| `server/api/categories/` | Public category endpoints |
| `server/api/admin/news/` | Admin news CRUD |
| `server/api/admin/categories/` | Admin categories CRUD |
| `server/api/auth/` | `me.get.ts` |
| `server/services/` | `news.service.ts`, `category.service.ts` |
| `server/repositories/` | `news.repository.ts`, `category.repository.ts`, `user.repository.ts` |
| `server/utils/` | `auth.ts` (requireAuth), `errors.ts` (createApiError), `response.ts` |
| `supabase/migrations/` | Schema: categories, news, RLS policies |
| `supabase/seeds/` | Seed data và admin setup |

## Nuxt 4 Rules

- App source nằm trong `app/`; không tạo root-level `components/`, `composables/`, `pages/`.
- Nitro server source nằm trong root-level `server/`, không nằm dưới `app/server/`.
- `app/components` auto-import; repo dùng `pathPrefix: false` → filename phải unique toàn project.
- `app/composables` auto-import nested vì `imports.dirs: ["composables/**"]`.
- `server/utils` được Nitro auto-import trong server code.
- `app/utils` dùng cho code shared client/server: validators, mappers, constants.
- Route middleware ở `app/middleware/`; server middleware ở `server/middleware/` — không thay thế nhau.
- Supabase schema changes phải có SQL artifact trong `supabase/migrations/` hoặc `supabase/seeds/`.

## Boundary rules

- `app/pages/`: orchestration + SEO meta + layout composition, không chứa business rule.
- `app/components/`: UI và interaction cục bộ, không chứa business rule.
- `app/composables/`: fetch state, submit state, feature interaction logic.
- `app/stores/`: chỉ cho shared client state sống lâu qua nhiều route — hiện tại chỉ `auth.ts`.
- `server/api/`: HTTP contract — validate input (Zod), auth guard, delegate xuống service.
- `server/services/`: business logic + permission check.
- `server/repositories/`: data access Supabase only, không có business logic.
- Client Supabase chỉ dùng cho Auth; business data đi qua `server/api/`.

## Full folder structure

```
app/
  pages/
    index.vue                       ← Home: featured + most viewed
    category/[slug].vue             ← Category: list + infinite scroll
    news/[slug].vue                 ← News detail + view count
    admin/
      login.vue
      index.vue                     ← Admin dashboard
      categories/
        index.vue
        create.vue
        [id].vue
      news/
        index.vue
        create.vue
        [id].vue
  layouts/
    default.vue                     ← Public layout
    admin.vue                       ← Admin panel layout
  components/
    ui/                             ← Primitives: UiButton, UiInput, UiModal...
    layout/                         ← LayoutHeader, LayoutFooter, LayoutNav
    news/                           ← NewsCard, NewsDetailBody, NewsPrevNextNav, NewsHero
    category/                       ← CategorySectionHeader, CategoryCard
    admin/                          ← AdminNewsTable, AdminNewsForm, AdminCategoryTable, AdminCategoryForm
    auth/                           ← AuthLoginForm
  composables/
    news/
      useFeaturedNews.ts
      useMostViewedNews.ts
      useNewsList.ts                ← pagination, infinite scroll
      useNewsDetail.ts
    categories/
      useCategoryList.ts
      useCategoryDetail.ts
    admin/
      useAdminNews.ts
      useAdminCategories.ts
    auth/
      useAuth.ts
      useRequireAuth.ts
  stores/
    auth.ts
  middleware/
    auth.ts                         ← guard admin routes
    guest.ts                        ← redirect logged-in user away from login
  types/
    news.ts                         ← NewsStatus, News DTO, NewsInput
    category.ts                     ← Category DTO, CategoryInput
    auth.ts                         ← AuthUser
    api.ts                          ← ApiSuccess<T>, ApiError
  utils/
    validators/
      news.ts                       ← Zod schema dùng chung client + server
      category.ts
    constants/
      news.ts                       ← NEWS_STATUS, etc.
      category.ts
    mappers/
      news.ts                       ← mapNews(row) → News
      category.ts                   ← mapCategory(row) → Category
    format/
      date.ts
      content.ts
  assets/
    icons/                          ← SVG icons (nuxt-svgo)

server/
  api/
    news/
      index.get.ts                  ← GET /api/news
      featured.get.ts               ← GET /api/news/featured
      most-viewed.get.ts            ← GET /api/news/most-viewed
      [slug].get.ts                 ← GET /api/news/:slug
      [id]/
        view.post.ts                ← POST /api/news/:id/view
    categories/
      index.get.ts                  ← GET /api/categories
      [slug].get.ts                 ← GET /api/categories/:slug
    admin/
      news/
        index.get.ts                ← GET /api/admin/news
        index.post.ts               ← POST /api/admin/news
        [id].get.ts
        [id].patch.ts
        [id].delete.ts
      categories/
        index.get.ts
        index.post.ts
        [id].patch.ts
        [id].delete.ts
    auth/
      me.get.ts
  services/
    news.service.ts
    category.service.ts
  repositories/
    news.repository.ts
    category.repository.ts
    user.repository.ts
  utils/
    auth.ts                         ← requireAuth(event)
    errors.ts                       ← createApiError helpers
    response.ts                     ← wrapSuccess helpers

supabase/
  migrations/
    YYYYMMDD_create_categories.sql
    YYYYMMDD_create_news.sql
  seeds/
    set_admin_role.sql
```

## Component naming (pathPrefix: false → filename phải unique)

| Component | File | Layer |
|-----------|------|-------|
| `<UiButton />` | `ui/UiButton.vue` | UI primitive |
| `<UiInput />` | `ui/UiInput.vue` | UI primitive |
| `<LayoutHeader />` | `layout/LayoutHeader.vue` | Public shell |
| `<NewsCard />` | `news/NewsCard.vue` | Domain |
| `<NewsDetailBody />` | `news/NewsDetailBody.vue` | Domain |
| `<NewsPrevNextNav />` | `news/NewsPrevNextNav.vue` | Domain |
| `<NewsHero />` | `news/NewsHero.vue` | Domain |
| `<CategorySectionHeader />` | `category/CategorySectionHeader.vue` | Domain |
| `<AdminNewsTable />` | `admin/AdminNewsTable.vue` | Domain |
| `<AdminNewsForm />` | `admin/AdminNewsForm.vue` | Domain |
| `<AdminCategoryTable />` | `admin/AdminCategoryTable.vue` | Domain |
| `<AdminCategoryForm />` | `admin/AdminCategoryForm.vue` | Domain |
| `<AuthLoginForm />` | `auth/AuthLoginForm.vue` | Domain |

## ✗ Không được làm

```
# ✗ Đừng đặt domain component trong ui/
app/components/ui/NewsCard.vue

# ✗ Đừng gọi Supabase business data từ page/component trực tiếp
const { data } = await supabase.from('news').select('*')

# ✗ Đừng đặt server state (news list, detail) vào Pinia
app/stores/news.ts với fetchList()

# ✗ Đừng đặt Zod schema trong server/ — đặt ở app/utils/validators/ để dùng chung
server/schemas/news.ts

# ✗ Đừng đặt server route trong app/
app/server/api/news.ts

# ✗ Đừng thay schema Supabase mà không có SQL trong repo
```

## Nguyên tắc incremental

- Chỉ tạo folder/file khi có feature thật cần dùng.
- Mỗi phase phải để lại kết quả build + typecheck + lint pass.
- API trước → UI sau trong mỗi phase.
