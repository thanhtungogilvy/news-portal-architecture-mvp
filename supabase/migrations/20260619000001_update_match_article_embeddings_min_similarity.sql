-- Update match_article_embeddings RPC:
-- - Add min_similarity param to filter at SQL level (no hard LIMIT needed)
-- - match_count = NULL means no limit (return all rows above threshold)
-- Backward compatible: existing callers with match_count still work.

BEGIN;

CREATE OR REPLACE FUNCTION public.match_article_embeddings(
  query_embedding vector,
  match_count     integer          DEFAULT NULL,
  filter          jsonb            DEFAULT '{}',
  min_similarity  double precision DEFAULT 0.0
)
RETURNS TABLE (
  article_id  uuid,
  similarity  double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.article_id,
    1 - (ae.embedding <=> query_embedding) AS similarity
  FROM public.article_embeddings ae
  WHERE (
    NOT (filter ? 'article_ids')
    OR ae.article_id IN (
      SELECT jsonb_array_elements_text(filter -> 'article_ids')::uuid
    )
  )
  AND (1 - (ae.embedding <=> query_embedding)) >= min_similarity
  ORDER BY ae.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMIT;
