## 1. Environment & Configuration

- [x] 1.1 Add `LMSTUDIO_BASE_URL`, `LMSTUDIO_EMBEDDING_MODEL`, `LMSTUDIO_CHAT_MODEL`, `AI_DEBUG`, `EMBEDDING_WORKER_POLL_MS`, `EMBEDDING_WORKER_BATCH_SIZE` to `.env.example`
- [x] 1.2 Create `scripts/probe-embedding-dim.ts` — call LM Studio `/v1/embeddings` with test input, print returned vector length

## 2. Database Migrations

- [x] 2.1 Create `supabase/migrations/*_enable_pgvector.sql` — `CREATE EXTENSION IF NOT EXISTS vector`
- [x] 2.2 Run probe script, confirm dimension N, then create `supabase/migrations/*_article_embeddings.sql` with `article_embeddings` table (`id`, `article_id FK`, `embedding vector(N)`, `embedding_text`, `embedding_model`, `created_at`, `updated_at`), upsert index, RLS (service_role only), and `match_article_embeddings(query_embedding, match_count, filter)` RPC function using cosine similarity
- [x] 2.3 Create `supabase/migrations/*_embedding_jobs.sql` — `embedding_jobs` table mirroring `view_count_jobs` schema (`id`, `article_id FK`, `status`, `attempt_count`, `last_error`, `created_at`, `started_at`, `finished_at`), index on `(status, created_at)`, `claim_pending_embedding_jobs(batch_size)` RPC using `FOR UPDATE SKIP LOCKED`
- [x] 2.4 Run `supabase db push` and verify migrations apply cleanly

## 3. LM Studio Provider

- [x] 3.1 Create `server/services/ai/lmstudio.provider.ts` — `embed(text: string): Promise<number[]>` calling `LMSTUDIO_BASE_URL/v1/embeddings` with `LMSTUDIO_EMBEDDING_MODEL`
- [x] 3.2 Add `chat(messages: ChatMessage[]): Promise<string>` to same provider — calling `LMSTUDIO_BASE_URL/v1/chat/completions` with `LMSTUDIO_CHAT_MODEL`
- [x] 3.3 Both functions throw descriptive errors when env vars missing or host unreachable
- [x] 3.4 Update `app/types/database.types.ts` to include `article_embeddings` and `embedding_jobs` table types (or run `supabase gen types typescript`)

## 4. Embedding Service & Repository

- [x] 4.1 Create `server/repositories/article-embedding.repository.ts` — `upsertEmbedding(client, row)` and `findEmbeddingByArticleId(client, articleId)` 
- [x] 4.2 Create `server/services/embedding.service.ts` — `buildEmbeddingText(article)` function that assembles structured text from title/summary/content/category, and `generateAndSaveEmbedding(client, articleId)` that calls provider and upserts

## 5. Embedding Job Queue

- [x] 5.1 Create `server/repositories/embedding-job.repository.ts` — `enqueueEmbeddingJob(client, articleId)`, `claimPendingEmbeddingJobs(client, batchSize)`, `completeJob(client, jobId)`, `failJob(client, jobId, error)`
- [x] 5.2 Modify `server/services/news.service.ts` — after `insertNews` and `updateNews` succeed, call `enqueueEmbeddingJob` (fire-and-forget: await the DB insert but do not await LM Studio)

## 6. Background Worker

- [x] 6.1 Create `lib/background/embedding/service.ts` — `processPendingEmbeddingJobs(client, batchSize)` following `lib/background/view-count/service.ts` pattern
- [x] 6.2 Create `workers/embedding.ts` — poll loop with `SIGINT`/`SIGTERM` shutdown, configurable poll interval and batch size
- [x] 6.3 Register embedding worker in `workers/all.ts`

## 7. Admin Backfill API

- [x] 7.1 Create `server/api/admin/embeddings/backfill.post.ts` — requires auth, finds all published articles without `completed`/`processing` embedding job, bulk-inserts pending jobs, returns `{ enqueued: N }` with HTTP 202

## 8. Validation

- [x] 8.1 Run `npm run lint` and fix any issues
- [x] 8.2 Run `npm run typecheck` and fix any type errors
- [x] 8.3 Manual smoke test: call backfill API, start worker, verify `article_embeddings` rows appear in Supabase
- [x] 8.4 Verify new article save enqueues a job row in `embedding_jobs`
