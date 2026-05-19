-- =============================================================================
-- Migration: create newsletter_subscribers
-- Date: 2026-05-19
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT newsletter_subscribers_email_key UNIQUE (email)
);

-- Fully locked down — all writes go through server API with service_role
REVOKE ALL ON TABLE public.newsletter_subscribers FROM public, anon, authenticated;
GRANT ALL ON TABLE public.newsletter_subscribers TO service_role;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated — only service_role (bypasses RLS) can access

COMMIT;

-- Verify
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'newsletter_subscribers';
