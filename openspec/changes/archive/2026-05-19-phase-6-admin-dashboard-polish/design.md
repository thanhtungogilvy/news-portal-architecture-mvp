## Context

The admin panel (Phase 4) shipped with a functioning sidebar that carries `icon` data in its nav-link array but never renders the icons in the template. The dashboard (`/admin`) is a static placeholder with emoji icons and no live data — editors see no summary of content state on login.

`nuxt-svgo` is already configured (`componentPrefix: "Icon"`, `autoImportPath: "./assets/icons/"`). Icons added to `app/assets/icons/` become auto-imported Vue components. Three Heroicons outline SVGs (`grid.svg`, `file-text.svg`, `tag.svg`) are absent but trivially added.

For stats, `GET /api/admin/news` already returns `meta.total` and supports `?status=` filtering. `GET /api/admin/categories` returns all categories. A dedicated `GET /api/admin/stats` can aggregate counts in a single round-trip using two lightweight COUNT queries instead of multiple fetched-and-discarded lists.

## Goals / Non-Goals

**Goals:**
- Render icons in the sidebar nav alongside each label.
- Display live stat cards on the dashboard (total articles, published, drafts, categories).
- Show the 5 most recently updated articles as an activity feed.
- Add quick-action CTAs (New Article, New Category) on the dashboard.
- No new npm dependencies; no database schema changes.

**Non-Goals:**
- No dark mode, theming, or responsive mobile sidebar.
- No per-user activity log or audit trail.
- No pagination or filtering on the recent-articles list.
- No changes to the table/form pages — only layout and dashboard.

## Decisions

### 1. Stats via dedicated `GET /api/admin/stats` endpoint

**Decision**: New endpoint `server/api/admin/stats.get.ts` that returns:
```ts
{
  news: { total: number, published: number, draft: number, archived: number },
  categories: { total: number }
}
```
Queries Supabase with `select('*', { count: 'exact', head: true })` + status filter — returns only the count, zero rows transferred.

**Alternatives considered**:
- *Multi-fetch from existing endpoints* (`GET /api/admin/news?limit=1` ×3 + categories) — 4 round-trips on every dashboard mount; wasteful.
- *Fetch-all + client-side compute* — transfers full article list just to count it; doesn't scale.

**Rationale**: Single call, minimal data transfer, no over-fetching. The endpoint is `requireAdmin`-guarded, consistent with all other admin endpoints.

---

### 2. Icon SVG files follow existing Heroicons outline style

**Decision**: Add `grid.svg`, `file-text.svg`, `tag.svg` sourced from Heroicons v2 outline set — the same set used by `pencil.svg`, `trash.svg`, `arrow-top-right-on-square.svg`. Each file is a 24×24 viewBox outline SVG.

**Rationale**: Visual consistency. All existing icons are Heroicons outline 24px. Mixing styles would look incoherent.

---

### 3. Sidebar template updated in-place — no new component

**Decision**: Update the `<NuxtLink>` template in `admin.vue` to render `<component :is="iconComponent(link.icon)" />`. A `iconComponent` lookup maps icon key → registered component name (e.g., `'grid'` → `IconGrid`).

**Alternative considered**: A separate `AdminNavLink.vue` component. Rejected — overkill for three static links.

---

### 4. Recent articles via existing `useAdminNews` with `limit=5`

**Decision**: Dashboard fetches `GET /api/admin/news?limit=5` (most recently updated, via default sort in repository). Reuses `useAdminNews` composable with no changes — just passes `{ limit: 5 }` as query.

**Rationale**: Zero new server code; the existing sort in `findAdminNews` already orders by `updated_at DESC`.

---

### 5. Stat cards link to filtered list views

**Decision**: The Published and Draft stat cards are `<NuxtLink>` elements navigating to `/admin/news?status=published` and `/admin/news?status=draft` respectively. This requires the news list page to read initial filter values from the URL query — a small addition to `news/index.vue`.

**Rationale**: Clicking a stat card to see the filtered list is the natural next action. Deeplinks make the filters shareable and browser-back-friendly (also fixes the "URL reflects state" guideline violation noted in the design review).

## Risks / Trade-offs

- **Stats count accuracy**: Counts are fetched once on mount, not live. An editor creating an article in another tab won't update the counters until the page is refreshed. Acceptable for an internal editorial tool. → No mitigation needed.
- **Icon component resolution**: `nuxt-svgo` registers components by filename. If the SVG file is named `file-text.svg` the component is `<IconFileText />`. The `iconComponent` map must match exactly or the component silently renders nothing. → Covered by typecheck: use a typed map.
