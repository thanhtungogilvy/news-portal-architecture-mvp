-- user_article_history — tracks anonymous session article views for personalization.
--
-- Used by the recommendation engine to build a per-session reading profile.
-- Only the last N entries per session are used at query time, so the table can
-- be pruned in future without affecting correctness.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_article_history (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_session_id text        NOT NULL,
  article_id           uuid        NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  viewed_at            timestamptz NOT NULL DEFAULT now()
);

-- Index for fetching recent views by session (used by recommendation engine)
CREATE INDEX IF NOT EXISTS idx_user_article_history_session_viewed
  ON public.user_article_history (anonymous_session_id, viewed_at DESC);

-- RLS: anon and authenticated users can insert their own history
ALTER TABLE public.user_article_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_history"
  ON public.user_article_history
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- service_role bypasses RLS by default — full access for recommendation queries

COMMIT;
