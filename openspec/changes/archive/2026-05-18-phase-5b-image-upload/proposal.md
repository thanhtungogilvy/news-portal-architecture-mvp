## Why

Editors currently paste external image URLs into the thumbnail field — images that can disappear, be hotlinked from untrusted sources, or be lost if the original host changes. Providing a first-party upload flow backed by Supabase Storage ensures thumbnails are always served from the project's own CDN and are permanently associated with the article.

## What Changes

- New Supabase Storage bucket `news-thumbnails` (public read, admin-only write/delete)
- New storage RLS migration SQL artifact
- New server endpoint `GET /api/admin/storage/news-thumbnails` — lists existing files in the bucket
- New server endpoint `POST /api/admin/upload` — accepts multipart form data, validates, client-side pre-compressed file, uploads to bucket, returns public URL
- New `AdminImageUpload.vue` component — two-tab UI: Upload new (drag-drop + browse) and Choose from Library (grid of existing files); handles client-side compression and upload; emits a URL string
- `AdminNewsForm.vue` — replaces the `UiInput type="url"` thumbnail field with `AdminImageUpload`
- `browser-image-compression` npm package added

## Capabilities

### New Capabilities

- `admin-image-upload`: Upload new thumbnail images with client-side compress + server-side Supabase Storage upload; validate size ≤ 5 MB and type image/*
- `admin-image-library`: Browse and select existing images from the `news-thumbnails` bucket without re-uploading

### Modified Capabilities

- `admin-news-ui`: Thumbnail input changes from a plain URL text field to `AdminImageUpload` — behavioral requirement: editors can now set thumbnails via upload or library selection, not just URL entry

## Impact

- `supabase/migrations/` — new migration for Storage bucket and RLS policies
- `server/api/admin/storage/news-thumbnails.get.ts` — new endpoint
- `server/api/admin/upload.post.ts` — new endpoint
- `app/components/admin/AdminImageUpload.vue` — new component
- `app/components/admin/AdminNewsForm.vue` — thumbnail field replaced
- `package.json` — add `browser-image-compression`
- No changes to `news` DB table schema (`thumbnail_url` remains TEXT)
