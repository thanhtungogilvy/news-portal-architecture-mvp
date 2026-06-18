-- article_embeddings — stores one vector embedding per news article.
--
-- IMPORTANT: The embedding dimension (768) must match the output of the loaded
-- LM Studio embedding model. Run `npx tsx scripts/probe-embedding-dim.ts` to
-- confirm the correct value before applying this migration. Changing the
-- dimension after articles are embedded requires dropping and rebuilding this
-- table.

BEGIN;

CREATE TABLE IF NOT EXISTS public.article_embeddings (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id       uuid        NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  embedding        vector(768) NOT NULL,
  embedding_text   text        NOT NULL,
  embedding_model  text        NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- One embedding per article (upsert target)
CREATE UNIQUE INDEX IF NOT EXISTS idx_article_embeddings_article_id
  ON public.article_embeddings (article_id);

-- IVFFlat index for approximate nearest-neighbour search (cosine distance)
-- Tune lists = sqrt(total rows); rebuild after backfill if needed.
CREATE INDEX IF NOT EXISTS idx_article_embeddings_embedding
  ON public.article_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RLS: only service_role can read/write embeddings
REVOKE ALL ON TABLE public.article_embeddings FROM public, anon, authenticated;
GRANT ALL ON TABLE public.article_embeddings TO service_role;

ALTER TABLE public.article_embeddings ENABLE ROW LEVEL SECURITY;

-- ── RPC: cosine similarity search ────────────────────────────────────────────
-- Returns article_id + similarity score for the closest match_count articles.
-- filter: optional jsonb of extra conditions (reserved for future use, ignored now).
CREATE OR REPLACE FUNCTION public.match_article_embeddings(
  query_embedding vector,
  match_count     integer DEFAULT 10,
  filter          jsonb   DEFAULT '{}'
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
  ORDER BY ae.embedding <=> query_embedding
  LIMIT GREATEST(match_count, 1);
END;
$$;

COMMIT;
