## Why

The current `content` field is a plain textarea — no formatting, no headings, no links. Editorial quality suffers and articles render as unstyled text blocks. Replacing the textarea with a TipTap rich-text editor gives editors a Word-like authoring experience while keeping the output as portable HTML stored in the existing TEXT column. At the same time, the "Create Category" flow allows only one category at a time, which is slow when setting up a new site. Batch creation via dynamic rows removes that friction.

## What Changes

- Add `@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image` npm packages
- Add `dompurify` + `@types/dompurify` for XSS-safe rendering of stored HTML
- New `AdminRichEditor.vue` component — TipTap editor with toolbar (Bold, Italic, H2, H3, BulletList, OrderedList, Blockquote, Code, Link, HardBreak, HorizontalRule, Image-by-URL)
- `AdminNewsForm.vue` — replace Body `UiInput type="textarea"` with `AdminRichEditor`
- `news/[slug].vue` — wrap `v-html` with DOMPurify sanitization
- `AdminCategoryForm.vue` and `admin/categories/create.vue` — replace single-row form with dynamic multi-row batch creation (Option B: name + slug per row, auto-slug)
- New `server/api/admin/categories/batch.post.ts` — accepts array of `CategoryCreateInput`, creates all in sequence, returns created items

## Capabilities

### New Capabilities

- `admin-rich-editor`: TipTap-powered rich text editor component for article body authoring; Standard extension set + Image-by-URL; output is HTML string stored in `news.content`
- `admin-category-batch-create`: Dynamic-row batch category creation UI; each row has name + auto-generated slug; rows can be added or removed; single submit creates all

### Modified Capabilities

- `admin-news-ui`: Body field changes from plain textarea to rich editor — requirement: content SHALL be valid HTML; editor SHALL support Standard extensions + Image-by-URL
- `news-detail-page`: `v-html` rendering of `article.content` SHALL sanitize HTML via DOMPurify before insertion to prevent XSS

## Impact

- `package.json` — add `@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `dompurify`, `@types/dompurify`
- `app/components/admin/AdminRichEditor.vue` — new component
- `app/components/admin/AdminNewsForm.vue` — body field swap
- `app/components/admin/AdminCategoryForm.vue` — replace with batch form
- `app/pages/admin/categories/create.vue` — wire batch form
- `app/pages/news/[slug].vue` — DOMPurify sanitize
- `server/api/admin/categories/batch.post.ts` — new batch endpoint
- No DB schema changes (`news.content` is already TEXT)
