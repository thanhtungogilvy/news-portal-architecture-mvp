-- Tighten RLS: replace authenticated-write policies with admin-only write/read policies.
-- Admin is defined as: (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'

-- ─── CATEGORIES ─────────────────────────────────────────────────────────────

-- Drop old authenticated-write policies
DROP POLICY IF EXISTS "categories_insert_authenticated" ON categories;
DROP POLICY IF EXISTS "categories_update_authenticated" ON categories;
DROP POLICY IF EXISTS "categories_delete_authenticated" ON categories;

-- Admin-only write policies
CREATE POLICY "categories_insert_admin"
  ON categories FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "categories_update_admin"
  ON categories FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "categories_delete_admin"
  ON categories FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ─── NEWS ────────────────────────────────────────────────────────────────────

-- Drop old authenticated-read (draft/archived) and authenticated-write policies
DROP POLICY IF EXISTS "news_select_authenticated" ON news;
DROP POLICY IF EXISTS "news_insert_authenticated" ON news;
DROP POLICY IF EXISTS "news_update_authenticated" ON news;
DROP POLICY IF EXISTS "news_delete_authenticated" ON news;

-- Admin can read all statuses (draft, published, archived)
CREATE POLICY "news_select_admin"
  ON news FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Admin-only write policies
CREATE POLICY "news_insert_admin"
  ON news FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "news_update_admin"
  ON news FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "news_delete_admin"
  ON news FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
