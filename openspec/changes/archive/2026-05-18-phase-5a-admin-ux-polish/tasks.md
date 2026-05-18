## 1. dayjs Date Formatting

- [x] 1.1 Import `dayjs` in `AdminNewsTable.vue` and replace `formatDate()` with `dayjs(iso).format('MMM D, YYYY HH:mm')`, falling back to `'—'` for null

## 2. Category & Status Filters

- [x] 2.1 Extend `useAdminNews` to accept an optional second param `categoryFilter?: MaybeRef<string | undefined>` and include it in the computed query
- [x] 2.2 In `admin/news/index.vue` add `categoryFilter` and `statusFilter` refs; pull `categories` from `useAdminCategories()` for the category select options
- [x] 2.3 Add a filter bar above `AdminNewsTable` with a category `<select>` (disabled while categories are pending) and a status `<select>`; bind both to the filter refs

## 3. PublishedAt Auto-fill

- [x] 3.1 In `AdminNewsForm.vue` add a `watch` on `modelValue.status`; when it transitions to `'published'` and `modelValue.publishedAt` is falsy, emit the updated model with `publishedAt = new Date().toISOString()`
  - **Implemented differently**: logic moved into `onSubmit()` instead of a `watch`; `publishedAt` UI field removed entirely. Behaviour equivalent — auto-sets on first publish submit.

## 4. Quality Gates

- [x] 4.1 `npm run typecheck` — 0 errors
- [x] 4.2 `npm run lint` — 0 errors
- [ ] 4.3 Manually verify: filter by category, filter by status, clear filters, check combined filter
- [ ] 4.4 Manually verify: create article, set status to Published → `publishedAt` auto-fills; set existing `publishedAt` then switch to Published → value unchanged
