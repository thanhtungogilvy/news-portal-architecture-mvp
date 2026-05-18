## Why

The admin panel is functional but visually underdeveloped: the sidebar shows text-only nav links (icon data exists but is never rendered), and the dashboard is a static placeholder with emoji icons and no real content data. Editors get no at-a-glance summary of the content state when they log in.

## What Changes

- **Sidebar icons**: Add three SVG icons (`grid`, `file-text`, `tag`) to `app/assets/icons/` and render them in the sidebar nav links in `admin.vue`. Icons will follow the existing Heroicons outline style already used elsewhere (pencil, trash, arrow-top-right-on-square).
- **Dashboard stats row**: Replace emoji placeholder cards with four stat cards — Total Articles, Published, Drafts, Categories — each sourced from a new lightweight `GET /api/admin/stats` endpoint.
- **Dashboard quick actions**: Add primary "New Article" and "New Category" CTA buttons directly on the dashboard, reducing clicks for the most common admin tasks.
- **Dashboard recent articles**: Show the 5 most recently updated articles (title, status badge, relative time) as a quick-glance activity feed.

## Capabilities

### New Capabilities

- `admin-sidebar-icons`: Sidebar navigation renders an SVG icon alongside each label, providing visual anchors and improving scannability.
- `admin-dashboard-stats`: Dashboard displays live stat cards (total/published/draft articles, total categories) fetched from a dedicated stats endpoint. Cards link to the corresponding list pages filtered by that status.
- `admin-dashboard-recent`: Dashboard displays a short list of the most recently updated articles with title, status, and relative time, giving editors an activity snapshot on login.

### Modified Capabilities

<!-- No existing spec-level requirements change. -->

## Impact

- New icons: `app/assets/icons/grid.svg`, `app/assets/icons/file-text.svg`, `app/assets/icons/tag.svg`
- Modified layout: `app/layouts/admin.vue` — add icon rendering to sidebar nav
- New server endpoint: `server/api/admin/stats.get.ts` (`GET /api/admin/stats`)
- New service method: `server/services/news.service.ts`, `server/services/category.service.ts` (or inline in endpoint for simplicity)
- Modified page: `app/pages/admin/index.vue` — replace emoji cards with stat cards + recent articles list
- No database schema changes; stats derived from existing `news` and `categories` tables
- No new npm dependencies
