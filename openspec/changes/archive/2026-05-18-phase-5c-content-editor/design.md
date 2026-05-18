## Context

`news.content` is stored as TEXT. Currently plain text is written and rendered with `v-html` in the detail page — meaning the column already accepts HTML; the only missing piece is the authoring experience and sanitization. No migration is needed for existing content (plain text is valid HTML text nodes).

The detail page already uses `v-html` without sanitization — a latent XSS risk. DOMPurify must be added as part of this change, not deferred.

## Goals / Non-Goals

**Goals:**
- Rich authoring experience: Bold, Italic, H2/H3, lists, blockquote, code, link, horizontal rule, hard break, image-by-URL
- Toolbar with explicit Image Insert dialog (URL + alt text + optional title)
- `thumbnail_url` and content images remain separate — the editor MUST NOT auto-inject `thumbnail_url` into body
- DOMPurify sanitization on public article render
- Batch category creation — dynamic rows (name + slug, auto-slug from name)

**Non-Goals:**
- Image upload inside TipTap (body images are URL-only)
- Table, YouTube embed
- Collaborative editing
- Custom TipTap nodes beyond the Standard + Image extension set

## Decisions

**TipTap output format: HTML string** — stored directly in `news.content`. Pros: portable, works with `v-html`, no migration. Cons: sanitization required on render. Mitigation: DOMPurify with `ALLOWED_TAGS` whitelist on `news/[slug].vue`.

**DOMPurify whitelist** — allow semantic HTML only: `p, br, strong, em, h2, h3, ul, ol, li, blockquote, code, pre, a, img, hr`. Strip `script`, `style`, `on*` attributes, `data:` URLs. Configure with `FORCE_BODY: true`.

**Toolbar implementation** — custom toolbar built with Tailwind buttons calling `editor.chain().focus()…` commands. No third-party TipTap UI library to avoid bundle bloat.

**Image Insert: modal dialog** — clicking the Image toolbar button opens a small inline form (URL, alt, title) before inserting the node. Prevents accidental bare-URL insertions.

**Batch category API: sequential inserts** — `Promise.all` over individual `POST /api/admin/categories` calls. Alternative (single batch endpoint) is also provided as `POST /api/admin/categories/batch` for atomicity — if one slug conflicts, the entire batch fails cleanly with a CONFLICT error listing the offending slug.

**`AdminCategoryForm` becomes batch-only** — the single-row form on `create.vue` is replaced by the batch form. Edit page (`[id].vue`) retains individual field editing (not batch).

## Risks / Trade-offs

- [Existing plain-text content rendered as HTML] → Plain text has no HTML tags, so `v-html` renders it as text nodes. DOMPurify preserves this. No visual regression.
- [TipTap bundle size ~80 KB gzipped] → Loaded only on admin routes. No impact to public site bundle.
- [Batch category slug conflicts abort entire batch] → Show per-row error highlighting after the CONFLICT response. User fixes the conflicting row and resubmits.
