BEGIN;

CREATE TABLE IF NOT EXISTS public.view_count_jobs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id       uuid        NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempt_count integer     NOT NULL DEFAULT 0,
  last_error    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  finished_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_view_count_jobs_status_created_at
  ON public.view_count_jobs (status, created_at);

REVOKE ALL ON TABLE public.view_count_jobs FROM public, anon, authenticated;
GRANT ALL ON TABLE public.view_count_jobs TO service_role;

ALTER TABLE public.view_count_jobs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_pending_view_count_jobs(batch_size integer DEFAULT 25)
RETURNS SETOF public.view_count_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT j.id
    FROM public.view_count_jobs j
    WHERE j.status = 'pending'
    ORDER BY j.created_at
    LIMIT GREATEST(batch_size, 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.view_count_jobs j
  SET
    status = 'processing',
    attempt_count = j.attempt_count + 1,
    started_at = now(),
    last_error = NULL
  FROM claimed
  WHERE j.id = claimed.id
  RETURNING j.*;
END;
$$;

COMMIT;
