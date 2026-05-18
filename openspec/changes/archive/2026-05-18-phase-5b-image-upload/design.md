## Context

Supabase Free plan is in use — no Image Transformations available. Thumbnails are displayed in two contexts: `NewsCard` (aspect-video, ~400 px wide) and `news/[slug]` hero (full-width max-w-3xl, up to 1280 px at 2× DPR). `thumbnail_url` stays a TEXT column in the DB; only the input method changes. The existing `AdminNewsForm` passes a URL string; that contract is unchanged.

## Goals / Non-Goals

**Goals:**
- Provide drag-drop + click-to-browse upload with client-side compression to WebP
- Provide a library picker to reuse existing `news-thumbnails` bucket files
- Validate file size ≤ 5 MB and MIME type `image/*` both client- and server-side
- Output a single optimized WebP stored in `news-thumbnails`, named `{timestamp}-{random4}.webp`
- Component emits a URL string — parent form is unaware of upload mechanics

**Non-Goals:**
- Image cropping or resizing after upload
- Multiple thumbnail sizes / responsive image variants (Supabase Free — no Transform)
- Inline body image upload (scoped to phase-5c TipTap; body images are URL-only)
- Replacing existing thumbnail URLs already stored in the DB

## Decisions

**Client-side compression before upload** — `browser-image-compression` with `maxWidthOrHeight: 1280`, `fileType: 'image/webp'`, `maxSizeMB: 0.5` runs in a Web Worker to avoid blocking the UI. Output covers both card (downscale) and detail hero (2× DPR) render contexts.

**`useDropZone` from VueUse** — already a project dependency; no new drag-drop library needed.

**Two-tab component, tabs disabled during compress/upload (Option A)** — prevents state conflicts from tab switching mid-flight. Simpler than cancellation logic.

**Server upload uses `serverSupabaseServiceRole`** — RLS policies restrict Storage writes to admin JWT; using service role on the server avoids the client having direct Storage access while keeping the API consistent with other admin endpoints that also gate via `requireAdmin`.

**Library endpoint `GET /api/admin/storage/news-thumbnails`** — lists bucket contents server-side (service role) and returns `{ name, size, createdAt, url }[]`. Client builds the public URL as `${SUPABASE_URL}/storage/v1/object/public/news-thumbnails/{name}`. Max 100 files returned, ordered by `created_at` descending.

**File naming: `{unix-ms}-{4-random-hex}.webp`** — e.g. `1716034800000-a3f2.webp`. Collision-resistant, time-sortable, not tied to article slug.

## Risks / Trade-offs

- [Browser support for WebP conversion via Canvas] → All modern browsers support it; no mitigation needed for MVP.
- [5 MB raw file → compress → still > 0.5 MB] → Rare for typical editorial photos. If it happens, the component shows an error "Image too complex to compress under limit — try a simpler image or reduce resolution first."
- [Storage bucket quota on Free plan (1 GB)] → At ~300 KB avg per thumbnail, ~3 300 articles fit before hitting quota. Acceptable for MVP scale.
- [Server re-validation adds latency] → One extra check on a small already-compressed file (< 0.5 MB). Negligible.
