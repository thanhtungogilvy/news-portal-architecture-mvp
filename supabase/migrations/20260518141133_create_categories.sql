-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read categories
CREATE POLICY "categories_select_public"
  ON categories FOR SELECT
  USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "categories_insert_authenticated"
  ON categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "categories_update_authenticated"
  ON categories FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "categories_delete_authenticated"
  ON categories FOR DELETE
  USING (auth.role() = 'authenticated');

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
