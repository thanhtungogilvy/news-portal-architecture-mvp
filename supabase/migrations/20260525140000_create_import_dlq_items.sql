BEGIN;

CREATE TABLE IF NOT EXISTS public.import_dlq_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         uuid        NOT NULL REFERENCES public.import_items(id),
  batch_id        uuid        NOT NULL REFERENCES public.import_batches(id),
  source_url      text        NOT NULL,
  failure_reason  text        NOT NULL,
  attempt_count   integer     NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_dlq_items_batch_id
  ON public.import_dlq_items (batch_id, created_at);

ALTER TABLE public.import_dlq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_dlq_items_select_admin"
  ON public.import_dlq_items FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "import_dlq_items_insert_admin"
  ON public.import_dlq_items FOR INSERT
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

COMMIT;
