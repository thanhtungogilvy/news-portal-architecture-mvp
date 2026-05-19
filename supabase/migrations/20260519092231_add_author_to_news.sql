-- Add author display name and avatar URL to news table (denormalized for CMS use)
ALTER TABLE news
  ADD COLUMN author_name       TEXT,
  ADD COLUMN author_avatar_url TEXT;
