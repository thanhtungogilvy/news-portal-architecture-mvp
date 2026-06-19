# Article Embeddings

Vector embeddings for news articles stored in Supabase pgvector, used by semantic search, recommendations, and RAG.

**Implemented in:** Phase 8.1 (`phase-8-embedding-foundation`)
**Last updated:** 2026-06-19

---

## Requirements

### Requirement: Embedding model and dimension are configured before migration
The system SHALL require a developer to probe the LM Studio embedding model dimension and hardcode it into the pgvector migration before running `supabase db push`. The `LMSTUDIO_EMBEDDING_MODEL` environment variable SHALL match the model loaded in LM Studio.

#### Scenario: Probe script returns dimension
- **WHEN** LM Studio is running with an embedding model loaded
- **THEN** running `npx tsx scripts/probe-embedding-dim.ts` SHALL print the integer vector length of the returned embedding

#### Scenario: Migration uses probed dimension
- **WHEN** migration `*_article_embeddings.sql` is applied
- **THEN** the `embedding` column in `article_embeddings` SHALL have type `vector(N)` where N equals the probed dimension

> **Current dimension:** 1024 (model: `gpustack/bge-m3-GGUF`). Switching models requires a migration to resize the column, truncate old embeddings, and reset all `embedding_jobs` to `pending`. See `supabase/migrations/20260619100000_resize_embedding_vector_1024.sql`.

---

### Requirement: Article embeddings are stored per published article
The system SHALL maintain an `article_embeddings` table where each published article MAY have at most one embedding row identified by `article_id`.

#### Scenario: Embedding row is created for new article
- **WHEN** an embedding job for article ID `X` completes successfully
- **THEN** a row with `article_id = X` SHALL exist in `article_embeddings` with a non-null `embedding` vector

#### Scenario: Embedding is upserted on re-embed
- **WHEN** an embedding job runs for an article that already has an embedding
- **THEN** the existing row SHALL be updated (upserted) — no duplicate rows

#### Scenario: Embedding text is stored for auditability
- **WHEN** an embedding is saved
- **THEN** `embedding_text` SHALL contain the plain-text string that was sent to LM Studio

#### Scenario: Embedding model is recorded
- **WHEN** an embedding is saved
- **THEN** `embedding_model` SHALL contain the model identifier string from `LMSTUDIO_EMBEDDING_MODEL`

---

### Requirement: Embedding text is built from article fields
The embedding service SHALL build embedding text from article title, summary, content excerpt (first 2000 chars, HTML stripped), and category name.

#### Scenario: All fields present
- **WHEN** article has title, summary, content, and category
- **THEN** embedding text SHALL follow format: `Title: ...\nSummary: ...\nDescription: ...\nCategory: ...`

#### Scenario: Optional fields absent
- **WHEN** article has no summary or category
- **THEN** embedding text SHALL omit absent field lines rather than including empty values

---

### Requirement: Vector similarity RPC function exists
The database SHALL expose a `match_article_embeddings(query_embedding, match_count, filter, min_similarity)` RPC function using cosine similarity (`<=>` operator).

#### Scenario: Similarity search returns ranked results
- **WHEN** `match_article_embeddings` is called with a query vector
- **THEN** it SHALL return rows ordered by cosine similarity descending, each including `article_id` and `similarity` score

#### Scenario: min_similarity filters irrelevant articles
- **WHEN** `min_similarity=0.40` is passed
- **THEN** only articles with cosine similarity ≥ 0.40 SHALL be returned

#### Scenario: match_count NULL means no hard limit
- **WHEN** `match_count` is NULL (default)
- **THEN** all articles above `min_similarity` threshold SHALL be returned without a row cap

---

### Requirement: Vector similarity index uses HNSW
The `article_embeddings` table SHALL use an HNSW index (not IVFFlat) for cosine similarity search.

#### Scenario: Index works after table truncation
- **WHEN** the table is truncated and repopulated
- **THEN** the HNSW index SHALL still return correct similarity results (unlike IVFFlat which builds broken centroids on empty tables)
