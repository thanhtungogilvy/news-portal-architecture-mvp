-- Add 'skipped' status to import_items for dedup cases.
-- Items that are skipped because the source URL or slug already exists in DB
-- are now marked 'skipped' instead of 'published' to avoid confusion.

BEGIN;

ALTER TABLE public.import_items
  DROP CONSTRAINT IF EXISTS import_items_status_check;

ALTER TABLE public.import_items
  ADD CONSTRAINT import_items_status_check
  CHECK (status IN ('pending', 'processing', 'published', 'skipped', 'failed'));

COMMIT;
