## Why

The admin news list currently shows raw ISO timestamps, has no filtering, and requires editors to manually enter `publishedAt` dates — slowing down the editorial workflow. These are high-value, zero-infra fixes that can ship independently of the larger content editor changes planned for phase-5b/5c.

## What Changes

- Replace `new Date().toLocaleDateString()` with `dayjs` formatting throughout admin tables
- Add category and status filter controls to the admin news list page
- Auto-fill `publishedAt` with the current timestamp when status is switched to `published` for the first time

## Capabilities

### New Capabilities

- `admin-news-filters`: Category and status filter controls on the admin news list, backed by existing `useAdminNews` composable query params
- `admin-news-published-at-auto`: Auto-fill `publishedAt` when status transitions to `published` in the news form

### Modified Capabilities

- `admin-news-ui`: Date formatting in `AdminNewsTable` changes from native JS to dayjs — no spec-level requirement change, implementation detail only

## Impact

- `app/components/admin/AdminNewsTable.vue` — replace `formatDate` with dayjs
- `app/components/admin/AdminNewsForm.vue` — add `publishedAt` auto-fill on status change
- `app/pages/admin/news/index.vue` — add filter bar (category select, status select), pass filters to `useAdminNews`
- `app/composables/admin/useAdminNews.ts` — extend to accept optional category filter alongside existing status filter
- No API changes, no DB changes, no new dependencies
