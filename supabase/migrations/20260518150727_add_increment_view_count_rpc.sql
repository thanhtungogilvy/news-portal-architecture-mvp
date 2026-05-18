-- Atomic view count increment for news articles.
-- Returns TRUE if the news was found and updated, FALSE if not found.
-- SECURITY DEFINER allows bypassing RLS for this specific write operation.
CREATE OR REPLACE FUNCTION increment_news_view_count(news_id UUID)
  RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE news SET view_count = view_count + 1 WHERE id = news_id;
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
