-- =============================================================================
-- Migration: resize article_embeddings vector column 768 → 1024
-- Date: 2026-06-19
-- Reason: switching embedding model to gpustack/bge-m3-GGUF (1024-dim output)
--
-- Steps:
--  1. Truncate existing 768-dim embeddings (incompatible with new model)
--  2. Drop dimension-specific IVFFlat index
--  3. ALTER column type to vector(1024)
--  4. Recreate IVFFlat index for 1024-dim cosine ops
--  5. Update match_article_embeddings function signature
--  6. Reset embedding_jobs to pending so worker re-embeds all articles
--  7. Create jobs for any articles that never had an embedding_job
-- =============================================================================

BEGIN;

-- 1. Remove all 768-dim embeddings (cannot mix dimensions)
TRUNCATE public.article_embeddings;

-- 2. Drop dimension-specific IVFFlat index before changing column type
DROP INDEX IF EXISTS idx_article_embeddings_embedding;

-- 3. Change embedding column from vector(768) to vector(1024)
ALTER TABLE public.article_embeddings
  ALTER COLUMN embedding TYPE vector(1024);

-- 4. Recreate IVFFlat index for 1024-dim cosine distance
--    lists = ~sqrt(rows); 100 is fine for ~300-500 articles, rebuild later if needed.
CREATE INDEX idx_article_embeddings_embedding
  ON public.article_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 5. Update RPC function to use vector(1024) explicitly
CREATE OR REPLACE FUNCTION public.match_article_embeddings(
  query_embedding vector(1024),
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

-- 6. Reset all existing embedding_jobs to pending so worker re-embeds everything
UPDATE public.embedding_jobs
SET
  status        = 'pending',
  attempt_count = 0,
  started_at    = NULL,
  finished_at   = NULL,
  last_error    = NULL
WHERE status IN ('completed', 'failed', 'processing');

-- 7. Create pending jobs for published articles that have no embedding_job yet
INSERT INTO public.embedding_jobs (article_id, status)
SELECT n.id, 'pending'
FROM public.news n
WHERE n.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM public.embedding_jobs ej WHERE ej.article_id = n.id
  );

COMMIT;

-- Verify
SELECT
  (SELECT COUNT(*) FROM public.article_embeddings)                         AS embeddings_after_truncate,
  (SELECT COUNT(*) FROM public.embedding_jobs WHERE status = 'pending')    AS jobs_pending,
  (SELECT COUNT(*) FROM public.embedding_jobs WHERE status = 'completed')  AS jobs_completed,
  pg_typeof(embedding)                                                       AS column_type
FROM public.article_embeddings
LIMIT 1;

-- If no rows yet (table just truncated), check column type via catalog:
SELECT attname, atttypmod
FROM pg_attribute
WHERE attrelid = 'public.article_embeddings'::regclass
  AND attname = 'embedding';
-- atttypmod = (dim * 4 + 4); for 1024-dim → atttypmod = 4100
