-- Add payload_snapshot column to import_dlq_items
-- Stores whatever the scraper extracted before failure (title, summary, content, etc.)
-- Useful for ops replay or debugging without re-fetching the URL

ALTER TABLE import_dlq_items
  ADD COLUMN IF NOT EXISTS payload_snapshot jsonb DEFAULT NULL;

COMMENT ON COLUMN import_dlq_items.payload_snapshot
  IS 'Partial article data extracted before failure, if any. NULL when scraping itself failed.';
