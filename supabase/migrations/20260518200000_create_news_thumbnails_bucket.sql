-- =============================================================================
-- Migration: Create news-thumbnails storage bucket with RLS policies
-- Date: 2026-05-18
-- Run in: Supabase Dashboard → SQL Editor (service role / postgres)
-- =============================================================================

BEGIN;

-- 1. Create public bucket for news thumbnail images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-thumbnails',
  'news-thumbnails',
  true,
  5242880,  -- 5 MB hard limit at bucket level
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS on storage.objects is enabled by default in Supabase

-- Public can read all objects in this bucket (public bucket)
CREATE POLICY "news_thumbnails_public_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'news-thumbnails');

-- Only admins can upload (INSERT)
CREATE POLICY "news_thumbnails_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'news-thumbnails'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Only admins can delete
CREATE POLICY "news_thumbnails_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'news-thumbnails'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Only admins can update (overwrite)
CREATE POLICY "news_thumbnails_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'news-thumbnails'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

COMMIT;

-- Verify
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'news-thumbnails';
