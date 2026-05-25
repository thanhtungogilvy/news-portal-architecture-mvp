BEGIN;

CREATE TABLE IF NOT EXISTS public.import_batches (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by             uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id            uuid        NOT NULL REFERENCES public.categories(id),
  source_count           integer     NOT NULL CHECK (source_count >= 0),
  status                 text        NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending', 'processing', 'completed', 'completed_with_failures', 'failed')),
  failure_email_sent_at  timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.import_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        uuid        NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  source_url      text        NOT NULL,
  status          text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'processing', 'published', 'failed')),
  attempt_count   integer     NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_retry_at   timestamptz NOT NULL DEFAULT now(),
  last_error      text,
  news_id         uuid        REFERENCES public.news(id) ON DELETE SET NULL,
  started_at      timestamptz,
  finished_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT import_items_batch_id_source_url_key UNIQUE (batch_id, source_url)
);

CREATE INDEX IF NOT EXISTS idx_import_batches_created_at
  ON public.import_batches (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_import_batches_status_created_at
  ON public.import_batches (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_import_items_batch_id_created_at
  ON public.import_items (batch_id, created_at);

CREATE INDEX IF NOT EXISTS idx_import_items_status_next_retry_at
  ON public.import_items (status, next_retry_at, created_at);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_batches_select_admin"
  ON public.import_batches FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "import_batches_insert_admin"
  ON public.import_batches FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "import_batches_update_admin"
  ON public.import_batches FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "import_batches_delete_admin"
  ON public.import_batches FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "import_items_select_admin"
  ON public.import_items FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "import_items_insert_admin"
  ON public.import_items FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "import_items_update_admin"
  ON public.import_items FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "import_items_delete_admin"
  ON public.import_items FOR DELETE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE TRIGGER import_batches_updated_at
  BEFORE UPDATE ON public.import_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER import_items_updated_at
  BEFORE UPDATE ON public.import_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
