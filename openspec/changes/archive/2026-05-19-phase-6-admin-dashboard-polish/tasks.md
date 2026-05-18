## 1. Sidebar Icons

- [x] 1.1 Add `app/assets/icons/grid.svg` — Heroicons outline 24px (dashboard icon)
- [x] 1.2 Add `app/assets/icons/file-text.svg` — Heroicons outline 24px (news icon)
- [x] 1.3 Add `app/assets/icons/tag.svg` — Heroicons outline 24px (categories icon)
- [x] 1.4 Update `app/layouts/admin.vue`: add a typed `iconMap` record mapping icon key → component, render `<component :is="iconMap[link.icon]" class="h-4 w-4 shrink-0" aria-hidden="true" />` inside each `<NuxtLink>`

## 2. Stats API Endpoint

- [x] 2.1 Create `server/api/admin/stats.get.ts`: call `requireAdmin`, query Supabase for news counts grouped by status (using `count: 'exact', head: true` per status filter) and category total, return `{ news: { total, published, draft, archived }, categories: { total } }`

## 3. Dashboard — Stats Cards

- [x] 3.1 Update `app/pages/admin/index.vue`: add `useFetch('/api/admin/stats', { server: false })` with `default: () => null`
- [x] 3.2 Replace emoji placeholder cards with four stat cards
- [x] 3.3 Show `UiSkeleton` placeholders in stat value slots while stats are pending
- [x] 3.4 Add "New Article" (`NuxtLink to="/admin/news/create"`) and "New Category" (`NuxtLink to="/admin/categories/create"`) quick-action buttons below the stat cards

## 4. Dashboard — Recent Articles Feed

- [x] 4.1 Update `app/pages/admin/index.vue`: fetch `GET /api/admin/news?limit=5` using `useFetch` with `server: false`; expose `recentNews` and `recentPending`
- [x] 4.2 Render a "Recent Articles" section with a compact list: title (truncated), `UiBadge` for status, relative time using `dayjs(article.updatedAt).fromNow()` — add `dayjs/plugin/relativeTime` import
- [x] 4.3 Each row is a `NuxtLink` to `/admin/news/<id>`
- [x] 4.4 Show 5 skeleton rows while `recentPending` is true
- [x] 4.5 Show "No articles yet." empty state when list is empty

## 5. Filter URL Sync (news list page)

- [x] 5.1 Update `app/pages/admin/news/index.vue`: initialise `statusFilter` and `categoryFilter` from `useRoute().query` on mount; add `watch` on both refs to sync changes back to URL via `useRouter().replace`

## 6. Quality Gates

- [x] 6.1 Run `npm run typecheck` — must pass with no new errors
- [x] 6.2 Run `npm run lint` — must pass clean
- [ ] 6.3 Manual: verify sidebar icons appear and match active/inactive colors
- [ ] 6.4 Manual: verify stat cards show live counts; Published/Draft cards navigate to filtered list
- [ ] 6.5 Manual: verify recent articles list shows 5 rows ordered by most-recently-updated; clicking navigates to edit page
