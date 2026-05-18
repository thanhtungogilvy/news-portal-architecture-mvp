-- Create news table
CREATE TABLE IF NOT EXISTS news (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  summary       TEXT,
  content       TEXT NOT NULL,
  thumbnail_url TEXT,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'published', 'archived')),
  view_count    INTEGER NOT NULL DEFAULT 0,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Public can read published news only
CREATE POLICY "news_select_published"
  ON news FOR SELECT
  USING (status = 'published');

-- Authenticated users can read all (including draft/archived for admin)
CREATE POLICY "news_select_authenticated"
  ON news FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can insert/update/delete
CREATE POLICY "news_insert_authenticated"
  ON news FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "news_update_authenticated"
  ON news FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "news_delete_authenticated"
  ON news FOR DELETE
  USING (auth.role() = 'authenticated');

-- Auto-update updated_at
CREATE TRIGGER news_updated_at
  BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
