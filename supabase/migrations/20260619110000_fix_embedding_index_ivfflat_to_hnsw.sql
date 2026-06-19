-- Fix: IVFFlat index was created on empty table → bad centroids → 0 results
-- Solution: drop IVFFlat, use HNSW instead (incremental build, no empty-table issue)
--
-- Why HNSW over IVFFlat here?
--  - IVFFlat computes centroids at creation time → must be created AFTER data loaded
--  - HNSW builds graph incrementally → works correctly regardless of when created
--  - IVFFlat needs ~39x lists rows to be effective; 100 lists needs 3,900+ rows
--    but we only have ~323 articles → IVFFlat is a poor fit at this scale
--  - HNSW is slower to build but faster and more accurate at query time

BEGIN;

-- 1. Drop the broken IVFFlat index
DROP INDEX IF EXISTS idx_article_embeddings_embedding;

-- 2. Create HNSW index for cosine distance (1024-dim)
--    m=16, ef_construction=64 are good defaults for this scale
CREATE INDEX idx_article_embeddings_embedding
  ON public.article_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

COMMIT;

-- Verify: this should now return results
SELECT article_id, similarity
FROM match_article_embeddings(
  ARRAY(SELECT 0.1::float8 FROM generate_series(1, 1024))::vector(1024),
  3,
  '{}',
  -1.0
);
