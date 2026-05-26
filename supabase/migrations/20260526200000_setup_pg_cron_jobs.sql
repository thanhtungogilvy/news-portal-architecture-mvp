-- ---------------------------------------------------------------------------
-- pg_cron + pg_net: schedule background cron jobs without Vercel paid plan
--
-- BEFORE applying this migration:
--   1. Enable pg_cron extension in Supabase Dashboard → Extensions → pg_cron
--
-- AFTER applying this migration:
--   Insert CRON_SECRET vào bảng internal_settings (chạy trong SQL Editor):
--        INSERT INTO internal_settings (key, value)
--        VALUES ('cron_secret', 'your-secret-here')
--        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
--
--   Dùng cùng giá trị với CRON_SECRET trong Vercel env vars.
--
-- Verify jobs:
--        SELECT jobname, schedule, active FROM cron.job;
-- ---------------------------------------------------------------------------

-- pg_net is pre-enabled on Supabase; ensure it is available
create extension if not exists pg_net with schema extensions;

-- Bảng lưu secret nội bộ — không expose ra ngoài
create table if not exists internal_settings (
  key   text primary key,
  value text not null
);

-- Chỉ service role mới đọc được
alter table internal_settings enable row level security;

-- Remove existing jobs if re-running this migration
select cron.unschedule('cron-view-count') where exists (
  select 1 from cron.job where jobname = 'cron-view-count'
);
select cron.unschedule('cron-import') where exists (
  select 1 from cron.job where jobname = 'cron-import'
);

-- View-count job: flush pending view counts every minute
select cron.schedule(
  'cron-view-count',
  '* * * * *',
  $$
    select net.http_post(
      url     => 'https://verdana-news.vercel.app/api/internal/cron/view-count',
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

-- Import job: process pending import items every minute
select cron.schedule(
  'cron-import',
  '* * * * *',
  $$
    select net.http_post(
      url     => 'https://verdana-news.vercel.app/api/internal/cron/import',
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

