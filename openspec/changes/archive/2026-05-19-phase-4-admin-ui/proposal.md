## Why

The admin API layer (news CRUD, categories CRUD, auth) is complete and tested. There is no corresponding UI — editors cannot manage content without direct API access. Phase 4 builds the admin panel that turns these APIs into a production-ready editorial dashboard suitable for daily use.

## What Changes

- **New admin layout shell** (`admin.vue`) wrapping all admin routes with sidebar navigation, user identity display, and logout.
- **Admin dashboard index** (`/admin`) with summary cards linking to news and categories management.
- **Admin news list page** (`/admin/news`) — paginated, filterable table of all news records with status badges, quick-action buttons (edit, delete), and a primary Create button.
- **Admin news create page** (`/admin/news/create`) — form to create a new article (title, slug, summary, body, category, status, featured flag, thumbnail URL, published_at).
- **Admin news edit page** (`/admin/news/[id]`) — same form pre-populated from API for updating existing articles.
- **Admin categories list page** (`/admin/categories`) — table of all categories with name, slug, and actions (edit, delete).
- **Admin category create page** (`/admin/categories/create`) — form to create a new category (name, slug).
- **Admin category edit page** (`/admin/categories/[id]`) — form pre-populated for updating existing category.
- **Reusable admin components**: `AdminNewsTable`, `AdminNewsForm`, `AdminCategoryTable`, `AdminCategoryForm`.
- **Reusable composables**: `useAdminNews`, `useAdminCategories`.
- **UiInput and UiModal primitives** — new primitives needed by admin forms and delete confirmations.
- **Destructive action confirmation** — delete flows guarded by a confirm modal (not browser `confirm()`).
- **Toast / inline feedback** — success and error feedback after each mutation.

## Capabilities

### New Capabilities

- `admin-layout`: Admin panel shell layout — sidebar, nav, user bar, logout. Wraps all admin routes.
- `admin-dashboard`: Admin index page with summary and navigation shortcuts.
- `admin-news-ui`: Full CRUD UI for news articles — list, create, edit, delete with status filters.
- `admin-categories-ui`: Full CRUD UI for categories — list, create, edit, delete.

### Modified Capabilities

- `ui-primitives`: Add `UiInput` (text/select/textarea form field) and `UiModal` (confirmation dialog) primitives required by admin forms and delete flows.

## Impact

- New pages: `app/pages/admin/index.vue`, `app/pages/admin/news/index.vue`, `app/pages/admin/news/create.vue`, `app/pages/admin/news/[id].vue`, `app/pages/admin/categories/index.vue`, `app/pages/admin/categories/create.vue`, `app/pages/admin/categories/[id].vue`
- New layout: `app/layouts/admin.vue`
- New components: `app/components/admin/AdminNewsTable.vue`, `app/components/admin/AdminNewsForm.vue`, `app/components/admin/AdminCategoryTable.vue`, `app/components/admin/AdminCategoryForm.vue`
- New composables: `app/composables/admin/useAdminNews.ts`, `app/composables/admin/useAdminCategories.ts`
- Modified components: `app/components/ui/UiButton.vue` (add `destructive` variant), `app/components/ui/UiBadge.vue` (add `danger` color)
- New UI primitives: `app/components/ui/UiInput.vue`, `app/components/ui/UiModal.vue`
- No database or server/api changes; all data goes through existing admin API endpoints.
- Auth guard middleware (`app/middleware/auth.ts`) already covers admin routes.
