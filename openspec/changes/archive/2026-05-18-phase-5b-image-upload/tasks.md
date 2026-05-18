## 1. Infrastructure — Supabase Storage

- [x] 1.1 Create `supabase/migrations/YYYYMMDD_create_news_thumbnails_bucket.sql` — INSERT into `storage.buckets` (id: `news-thumbnails`, public: true) and create RLS policies: public SELECT, admin-only INSERT and DELETE (check `app_metadata.role = 'admin'`)

## 2. Server Endpoints

- [x] 2.1 Create `server/api/admin/storage/news-thumbnails.get.ts` — `requireAdmin`, list bucket via `serverSupabaseServiceRole`, return `{ data: [{ name, size, createdAt, url }] }` (max 100, newest first)
- [x] 2.2 Create `server/api/admin/upload.post.ts` — `requireAdmin`, `readMultipartFormData`, validate file size ≤ 5 MB and MIME `image/*`, upload to `news-thumbnails` bucket via `serverSupabaseServiceRole`, return `{ data: { url } }`

## 3. Dependencies

- [x] 3.1 `npm install browser-image-compression` and add to `package.json`

## 4. AdminImageUpload Component

- [x] 4.1 Create `app/components/admin/AdminImageUpload.vue` — props: `modelValue: string | null`, `disabled?: boolean`; emits `update:modelValue: [url: string | null]`
- [x] 4.2 Implement idle/selected state machine — show tab picker when no URL, show preview + "Change image" + "Remove" when URL is set
- [x] 4.3 Implement Upload tab — `useDropZone` drag-drop + hidden `<input type="file" accept="image/*">` for click-to-browse; validate size/type; compress with `browser-image-compression` (maxWidthOrHeight 1280, fileType webp, maxSizeMB 0.5); POST to `/api/admin/upload`; emit URL on success
- [x] 4.4 Implement Library tab — fetch `GET /api/admin/storage/news-thumbnails` on tab open; show image grid (4-col); click emits URL; show empty-state when no files; show loading skeleton while fetching
- [x] 4.5 Disable both tabs during `compressing` and `uploading` status
- [x] 4.6 Show inline error messages for: file too large, non-image type, upload failure, post-compress still too large

## 5. Wire Into Form

- [x] 5.1 In `AdminNewsForm.vue` replace the `UiInput type="url"` thumbnail field with `<AdminImageUpload v-model="..." />`

## 6. Quality Gates

- [x] 6.1 `npm run typecheck` — 0 errors
- [x] 6.2 `npm run lint` — 0 errors
- [ ] 6.3 Manually verify: drag-drop upload, click-to-browse upload, library grid loads, library select sets URL, remove clears URL, file > 5 MB rejected, non-image rejected
