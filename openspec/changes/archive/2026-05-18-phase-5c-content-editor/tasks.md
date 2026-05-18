## 1. Dependencies

- [x] 1.1 `npm install @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image`
- [x] 1.2 `npm install dompurify && npm install -D @types/dompurify`

## 2. Batch Category API

- [x] 2.1 Create `server/api/admin/categories/batch.post.ts` — `requireAdmin`, validate body as `CategoryCreateInput[]` with Zod (array min 1), call `insertCategory` for each in a `Promise.all`, return `successResponse(created)` or throw `409 CONFLICT` with the conflicting slug if any insert fails
  - **Implemented with sequential loop** (not `Promise.all`) for safer partial-insert semantics; 409 CONFLICT propagates from `insertCategory` repository on unique violation.

## 3. DOMPurify Sanitization

- [x] 3.1 In `app/pages/news/[slug].vue` import `DOMPurify` and create a `sanitize(html)` helper using `ALLOWED_TAGS` whitelist (`p, br, strong, em, h2, h3, ul, ol, li, blockquote, code, pre, a, img, hr`) and `FORBID_ATTR: ['onerror', 'onload', 'onclick']`
  - **Implemented with `ALLOWED_ATTR` whitelist** instead of `FORBID_ATTR` (more restrictive/safer); also includes `u`, `s`, `h4` tags.
- [x] 3.2 Replace the raw `v-html="article.content"` binding with `v-html="sanitize(article.content)"`

## 4. AdminRichEditor Component

- [x] 4.1 Create `app/components/admin/AdminRichEditor.vue` — props: `modelValue: string`, `placeholder?: string`, `error?: string`; emits `update:modelValue: [value: string]`; initialize TipTap with StarterKit + Link + Image extensions
- [x] 4.2 Build toolbar row with buttons: Bold, Italic, H2, H3, BulletList, OrderedList, Blockquote, Code, HorizontalRule, Link, Insert Image — use `editor.isActive()` for active state styling
- [x] 4.3 Implement Insert Image inline dialog — fields: URL (required), Alt (required), Title (optional); validate URL format before insert; `editor.chain().focus().setImage({ src, alt, title }).run()`
  - **Enhanced**: dialog also includes library picker (thumbnail + storage grid) so editors can reuse uploaded images.
- [x] 4.4 Implement Link button — prompt URL; `editor.chain().focus().setLink({ href }).run()`; if selection already has link, toggle off
- [x] 4.5 Emit `update:modelValue` on every editor `update` transaction with `editor.getHTML()`

## 5. Wire Rich Editor into News Form

- [x] 5.1 In `AdminNewsForm.vue` replace `UiInput type="textarea"` for Body with `<AdminRichEditor v-model="modelValue.content" ... />`

## 6. Batch Category Create UI

- [x] 6.1 Update `AdminCategoryForm.vue` to accept an array of rows (`CategoryCreateInput[]`) instead of a single value; each row has its own `slugManuallyEdited` flag and inline error state
  - **Implemented as new component** `AdminBatchCategoryForm.vue` — `AdminCategoryForm.vue` kept for edit page (single-row). This better matches the design intent (edit page retains individual editing).
- [x] 6.2 Add "Add row" button; add per-row remove button (disabled when only 1 row)
- [x] 6.3 Update `app/pages/admin/categories/create.vue` to initialize with one empty row, call `POST /api/admin/categories/batch`, handle 409 by highlighting conflicting rows

## 7. Quality Gates

- [x] 7.1 `npm run typecheck` — 0 errors
- [x] 7.2 `npm run lint` — 0 errors
- [ ] 7.3 Manually verify: rich editor toolbar actions all work, image insert dialog, link insert/remove
- [ ] 7.4 Manually verify: public article renders formatted HTML correctly; script tags stripped
- [ ] 7.5 Manually verify: batch category create — add rows, auto-slug, manual slug override, submit, conflict error shown per row
