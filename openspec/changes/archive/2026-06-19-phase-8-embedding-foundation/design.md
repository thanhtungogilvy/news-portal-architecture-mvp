## Context

The news portal stores articles in Supabase Postgres. Currently there is no semantic understanding of article content — all retrieval is keyword or filter based. Phase 8 adds three AI features (semantic search, recommendations, RAG chatbot) that all depend on pre-computed article embeddings stored as pgvector columns.

This design covers the shared foundation: the embedding pipeline, job queue, LM Studio provider, and vector similarity infrastructure that all three AI features consume.

**Current state:** No pgvector, no embeddings, no AI provider. Article create/update in `news.service.ts` has no AI side-effects.

**Constraints:**
- LM Studio runs locally; no paid AI provider
- Embedding dimension is determined by the loaded model and must be fixed before the migration is written
- The article save path must not block on LM Studio calls
- The embedding worker must follow the existing `view_count_jobs` / background worker pattern already in the codebase

## Goals / Non-Goals

**Goals:**
- Enable pgvector in Supabase
- Store one embedding vector per published article in `article_embeddings`
- Provide a shared `lmstudio.provider.ts` used by all Phase 8 features
- Process embedding jobs asynchronously via `embedding_jobs` queue and a background worker
- Allow admin to trigger backfill for all published articles
- Enqueue embedding jobs automatically after article create/update

**Non-Goals:**
- Search UI, recommendation UI, chatbot UI (Phase 8.2–8.4)
- Streaming embeddings or real-time embedding updates
- Multi-provider AI abstraction (only LM Studio for this POC)
- Embedding versioning / model migration tooling

## Decisions

### Decision 1 — Probe dimension before migration

**Choice:** A one-time manual probe script queries LM Studio `/v1/embeddings` and prints the vector length. The developer hardcodes that value into the migration file and commits both.

**Rationale:** Migrations are version-controlled and must be reproducible without LM Studio running. A dynamic migration generation would require LM Studio at `supabase db push` time, which breaks CI and other developer machines. Probing once and committing the dimension as a constant is the safest approach for a team or future maintainer.

**Alternative rejected:** Auto-generate migration at worker startup — rejected because it would make migrations non-deterministic and non-repeatable.

### Decision 2 — Follow existing `view_count_jobs` pattern for `embedding_jobs`

**Choice:** `embedding_jobs` table mirrors `view_count_jobs` schema: `status` (pending/processing/completed/failed), `attempt_count`, `last_error`, `claim_pending_embedding_jobs(batch_size)` RPC using `FOR UPDATE SKIP LOCKED`.

**Rationale:** The pattern is already proven in this codebase, handles concurrent workers safely, and the DBA/service_role permissions model is already established. Reusing the pattern reduces cognitive overhead and keeps the infrastructure consistent.

**Alternative rejected:** Supabase pg_cron directly calling LM Studio — rejected because pg_cron runs in Postgres and cannot make external HTTP calls.

### Decision 3 — Fire-and-forget embedding enqueue after article save

**Choice:** `news.service.ts` calls `enqueueEmbeddingJob(event, articleId)` after `insertNews` / `updateNews` returns. The call is awaited for the DB insert (to ensure the job row exists) but does not call LM Studio synchronously.

**Rationale:** LM Studio calls take 100ms–3s depending on model load. Blocking the admin article save on this would degrade UX. Eventual consistency (embedding available seconds after save) is acceptable for a POC.

**Alternative rejected:** Synchronous embedding in the save path — rejected due to latency and LM Studio availability coupling.

### Decision 4 — Embedding text format

**Choice:** Build embedding text as a structured plain-text string:
```
Title: <title>
Summary: <summary>
Description: <excerpt of content, first 500 chars, HTML stripped>
Category: <category name>
```

**Rationale:** Structured field labels help the embedding model attend to each semantic dimension independently. Content is truncated to avoid token limit issues with small models. HTML is stripped to remove noise.

**Alternative rejected:** Concatenating raw HTML content — rejected because HTML tags add noise to the embedding space.

### Decision 5 — `article_embeddings` as separate table, not column on `news`

**Choice:** Separate `article_embeddings` table with FK to `news.id`.

**Rationale:** Keeps the `news` table schema clean. Allows re-generating embeddings with a different model without touching the news table. Makes it easy to add `embedding_model` and `embedding_text` audit columns without polluting the main table. Matches the design of other jobs/metadata tables in this codebase.

**Alternative rejected:** Adding `embedding vector(N)` column directly to `news` — rejected because it couples model selection to the core schema and makes re-embedding harder.

## Risks / Trade-offs

**[Risk] Embedding dimension locked after first migration**
→ Mitigation: Document clearly in `supabase/migrations/` and `.env.example` that changing the embedding model requires dropping and rebuilding `article_embeddings`. Accept this for POC.

**[Risk] LM Studio not running during backfill**
→ Mitigation: Jobs remain `pending` in DB, worker retries with backoff. Admin can re-trigger backfill endpoint. No data is lost.

**[Risk] Eventual consistency window**
→ Mitigation: Article is published immediately; embedding lags by seconds to minutes depending on worker poll interval. Document as known behavior. Not relevant for demo scenario.

**[Risk] Large backfill (many articles) floods job table**
→ Mitigation: Backfill API inserts jobs in bulk but worker processes in small batches (5–10). Worker polls at configurable interval. No thundering herd.

**[Trade-off] No embedding versioning**
→ `embedding_model` column on `article_embeddings` records which model generated each vector. If model changes, a full rebuild is required. Acceptable for POC.

## Migration Plan

1. Developer starts LM Studio, loads `embeddinggemma-300m-qat-GGUF`
2. Developer runs probe script: `npx tsx scripts/probe-embedding-dim.ts`
3. Script prints dimension (e.g., `768`)
4. Developer sets dimension in migration file and commits
5. Run `supabase db push` (or migration runs in CI)
6. Start embedding worker: `npx tsx workers/embedding.ts`
7. Call `POST /api/admin/embeddings/backfill` to enqueue jobs for existing articles
8. Monitor job table until all articles have `completed` embeddings

**Rollback:** Drop `article_embeddings` and `embedding_jobs` tables. Remove embedding enqueue from `news.service.ts`. No breaking changes to public API.

## Open Questions

- None — dimension probe strategy and all decisions are resolved per Phase 8 Final Decisions.
