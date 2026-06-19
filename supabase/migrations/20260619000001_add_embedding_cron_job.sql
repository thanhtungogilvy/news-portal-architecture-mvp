-- ---------------------------------------------------------------------------
-- Add pg_cron job for the embedding worker.
--
-- BEFORE applying this migration, ensure:
--   1. pg_cron and pg_net extensions are enabled (done in previous migration)
--   2. internal_settings table exists with cron_secret value (done in previous migration)
--   3. LMSTUDIO_BASE_URL and LMSTUDIO_EMBEDDING_MODEL env vars are set in Vercel
--      (or replaced with a production embedding provider — see note below)
--
-- NOTE — Production embedding:
--   LM Studio only runs locally. On production (Vercel/cloud), point
--   LMSTUDIO_BASE_URL to a hosted OpenAI-compatible embedding endpoint, e.g.:
--     - OpenAI:   https://api.openai.com  + LMSTUDIO_EMBEDDING_MODEL=text-embedding-3-small
--     - Together: https://api.together.xyz
--     - Any self-hosted endpoint with the same /v1/embeddings shape
--   The lmstudio.provider.ts client is fully compatible — only the base URL
--   and model name change.
--
-- Verify:
--   SELECT jobname, schedule, active FROM cron.job;
-- ---------------------------------------------------------------------------

select cron.unschedule('cron-embedding') where exists (
  select 1 from cron.job where jobname = 'cron-embedding'
);

-- Embedding job: process pending embedding jobs every minute
select cron.schedule(
  'cron-embedding',
  '* * * * *',
  $$
    select net.http_post(
      url     => 'https://verdana-news.vercel.app/api/internal/cron/embedding',
      body    => '{}'::jsonb,
      headers => jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (
          select value from internal_settings where key = 'cron_secret'
        )
      )
    );
  $$
);
