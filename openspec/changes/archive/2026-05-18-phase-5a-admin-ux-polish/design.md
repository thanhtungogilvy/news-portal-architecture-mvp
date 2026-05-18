## Context

The admin news list currently has no filtering and uses native `Date` formatting. The news form requires manual entry of `publishedAt`. All three issues are isolated UI/composable changes — no API or DB work required.

## Goals / Non-Goals

**Goals:**
- Replace native date formatting with dayjs in `AdminNewsTable`
- Add category and status filter controls to `admin/news/index.vue`
- Auto-fill `publishedAt` when status transitions to `published` the first time

**Non-Goals:**
- Server-side filter pagination changes (filters pass as existing query params)
- Sorting beyond what the API already returns
- Any DB or API schema changes

## Decisions

**dayjs already in project** — no new dependency. Import directly in `AdminNewsTable.vue`, format as `MMM D, YYYY HH:mm`.

**Filters live in page, not composable** — `admin/news/index.vue` holds `categoryFilter` and `statusFilter` as local `ref`s and passes them to `useAdminNews()`. The composable already accepts `statusFilter`; add `categoryFilter` as a second `MaybeRef` param alongside it.

**PublishedAt auto-fill: watch on status field inside `AdminNewsForm`** — when `modelValue.status` transitions to `'published'` and `modelValue.publishedAt` is null/empty, emit the updated model with `publishedAt = new Date().toISOString()`. User can still override manually.

**Category list for filter bar**: reuse `useAdminCategories()` already called on the page for the delete modal context. No extra fetch needed.

## Risks / Trade-offs

- `publishedAt` auto-fill fires on every status → published transition. If an editor toggles draft → published → draft → published, the timestamp resets. Acceptable for MVP; editorial workflow typically doesn't toggle status repeatedly.
- Filter bar fetches categories on page mount. On slow connections the filter select may briefly show empty — mitigated by skeleton/disabled state while categories are pending.
