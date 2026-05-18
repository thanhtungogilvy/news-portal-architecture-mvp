## 1. Auth Middleware Fix

- [x] 1.1 Update `app/middleware/auth.ts` to redirect unauthenticated users to `/admin/login` instead of `/login`

## 2. UI Primitives — UiButton & UiBadge Extensions

- [x] 2.1 Add `destructive` variant to `UiButton` (red bg, white text, red hover state using `error` theme tokens)
- [x] 2.2 Add `danger` color to `UiBadge` (red chip using `error.light` bg + `error.dark` text)

## 3. UI Primitives — UiInput

- [x] 3.1 Create `app/components/ui/UiInput.vue` with `inheritAttrs: false`
- [x] 3.2 Support `type` prop: `text | email | url | textarea | select`; render correct element per type
- [x] 3.3 Accept `label`, `placeholder`, `modelValue`, `error` props; emit `update:modelValue`
- [x] 3.4 Bind `$attrs` to inner element; style label, input, and error message with Tailwind theme tokens
- [x] 3.5 Verify `v-model` round-trip works on `UiInput` with all type variants

## 4. UI Primitives — UiModal

- [x] 4.1 Create `app/components/ui/UiModal.vue` with `v-model:open` binding
- [x] 4.2 Render modal backdrop overlay and centered dialog card when `open = true`; hide when `open = false`
- [x] 4.3 Accept `title`, `confirmLabel` (default "Confirm"), `cancelLabel` (default "Cancel"), `confirmVariant` (default "primary") props
- [x] 4.4 Emit `confirm` and `cancel` events; close modal (`open = false`) on either action
- [x] 4.5 Close modal on backdrop click (emit `cancel`)
- [x] 4.6 Render default `<slot />` for body content

## 5. Admin Toast Composable

- [x] 5.1 Create `app/composables/admin/useAdminToast.ts` — reactive `message: { text: string; type: 'success' | 'error' } | null` and `show(text, type)` / `clear()` functions using a module-level ref so state is shared across the layout

## 6. Admin Layout

- [x] 6.1 Create `app/layouts/admin.vue` with two-column structure: fixed left sidebar + `<main>` with `<slot />`
- [x] 6.2 Add sidebar navigation links: Dashboard (`/admin`), News (`/admin/news`), Categories (`/admin/categories`) with active-link highlight using `useRoute()`
- [x] 6.3 Display logged-in user email in sidebar footer using `useSupabaseUser()`
- [x] 6.4 Add Logout button in sidebar footer wired to `useAuth().signOut()` → redirect to `/admin/login`
- [x] 6.5 Render toast notification bar driven by `useAdminToast` — auto-dismisses after 4 seconds
- [x] 6.6 Style sidebar with `dark` theme tokens (dark background, white nav text); style main area with `smoke-50` background

## 7. Admin Composables

- [x] 7.1 Create `app/composables/admin/useAdminCategories.ts` — `useFetch` for list, `$fetch` mutations for `create(input)`, `update(id, input)`, `remove(id)`; expose `pending`, `error`
- [x] 7.2 Create `app/composables/admin/useAdminNews.ts` — same pattern as above for news; include `useFetch` for list with optional `status` query param

## 8. Admin Dashboard Page

- [x] 8.1 Create `app/pages/admin/index.vue` with `definePageMeta({ layout: 'admin', middleware: 'auth' })`
- [x] 8.2 Render page header (title "Dashboard", short description) and two `UiCard` summary cards: News → `/admin/news`, Categories → `/admin/categories`

## 9. AdminCategoryTable Component

- [x] 9.1 Create `app/components/admin/AdminCategoryTable.vue` accepting `categories: Category[]` and `loading: boolean` props
- [x] 9.2 Render table with columns: Name, Slug, Actions
- [x] 9.3 Emit `edit(id: string)` and `delete(id: string)` events for row actions
- [x] 9.4 Show skeleton rows when `loading = true`; show empty state message when list is empty

## 10. AdminCategoryForm Component

- [x] 10.1 Create `app/components/admin/AdminCategoryForm.vue` with `v-model` (modelValue: CategoryInput), `loading` prop; emit `submit` and `cancel`
- [x] 10.2 Render `UiInput` fields: `name` (text) and `slug` (text)
- [x] 10.3 Auto-generate slug from name when slug field has not been manually edited (watch `name`, slugify to kebab-case)
- [x] 10.4 Client-side validation using `app/utils/validators/category.ts` Zod schema; show inline errors via `UiInput error` prop
- [x] 10.5 Render `UiButton` (primary) for Save and `UiButton` (secondary) for Cancel

## 11. Admin Categories Pages

- [x] 11.1 Create `app/pages/admin/categories/index.vue` — fetch list via `useAdminCategories`, render `AdminCategoryTable`, wire delete modal with `UiModal`
- [x] 11.2 Create `app/pages/admin/categories/create.vue` — render `AdminCategoryForm`, call `create()` on submit, show toast, navigate to list
- [x] 11.3 Create `app/pages/admin/categories/[id].vue` — fetch single category via `$fetch('GET /api/admin/categories/:id')`, pre-populate `AdminCategoryForm`, call `update()` on submit, handle not-found

## 12. AdminNewsTable Component

- [x] 12.1 Create `app/components/admin/AdminNewsTable.vue` accepting `news: News[]` and `loading: boolean` props
- [x] 12.2 Render table with columns: Title, Status (badge), Category, Published At, Actions
- [x] 12.3 Use `UiBadge` for status (`published` → success, `draft` → warning, `archived` → danger) — `is_featured` badge omitted: field does not exist in DB schema (deferred to schema migration)
- [x] 12.4 Emit `edit(id: string)` and `delete(id: string)` events for row actions
- [x] 12.5 Show skeleton rows when `loading = true`; show empty state message when list is empty

## 13. AdminNewsForm Component

- [x] 13.1 Create `app/components/admin/AdminNewsForm.vue` with `v-model` (modelValue: NewsInput), `loading` prop, `categories: Category[]` prop; emit `submit` and `cancel`
- [x] 13.2 Render `UiInput` fields: `title` (text), `slug` (text), `summary` (textarea), `body` (textarea), `thumbnail_url` (url), `published_at` (text, ISO date)
- [x] 13.3 Render `UiInput type="select"` for `category_id` (populated from `categories` prop) and `status` (draft | published | archived)
- [x] 13.4 `is_featured` checkbox omitted: field does not exist in DB schema (deferred to schema migration)
- [x] 13.5 Auto-generate slug from title when slug has not been manually edited
- [x] 13.6 Client-side validation using `app/utils/validators/news.ts` Zod schema; show inline errors
- [x] 13.7 Render `UiButton` (primary) for Save / Publish and `UiButton` (secondary) for Cancel

## 14. Admin News Pages

- [x] 14.1 Create `app/pages/admin/news/index.vue` — fetch list via `useAdminNews`, render `AdminNewsTable`, wire delete modal with `UiModal`
- [x] 14.2 Create `app/pages/admin/news/create.vue` — fetch categories for form select, render `AdminNewsForm`, call `create()` on submit, show toast, navigate to list
- [x] 14.3 Create `app/pages/admin/news/[id].vue` — fetch article and categories, pre-populate `AdminNewsForm`, call `update()` on submit, handle not-found

## 15. Quality Gates

- [x] 15.1 Run `npm run typecheck` — resolve all TypeScript errors
- [x] 15.2 Run `npm run lint` — resolve all ESLint errors
- [ ] 15.3 Manually verify admin login → dashboard → create category → edit category → delete category flow
- [ ] 15.4 Manually verify create news → edit news → delete news flow
- [ ] 15.5 Verify unauthenticated users are redirected to `/admin/login` when hitting any admin route
