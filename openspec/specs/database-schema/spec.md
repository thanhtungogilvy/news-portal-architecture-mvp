## ADDED Requirements

### Requirement: categories table has required columns
The `categories` table in Supabase SHALL have: `id` (uuid PK), `name` (text, not null), `slug` (text, unique, not null), `created_at` (timestamptz, default now()), `updated_at` (timestamptz, default now()).

#### Scenario: Slug uniqueness enforced
- **WHEN** inserting a category with a duplicate slug
- **THEN** Supabase SHALL reject the insert with a unique constraint violation

#### Scenario: Default timestamps
- **WHEN** inserting a category without specifying timestamps
- **THEN** `created_at` and `updated_at` SHALL be set to the current time

### Requirement: news table has required columns
The `news` table SHALL have: `id` (uuid PK), `title` (text, not null), `slug` (text, unique, not null), `summary` (text), `content` (text, not null), `thumbnail_url` (text), `category_id` (uuid, FK → categories.id), `author_id` (uuid, FK → auth.users.id), `status` (text, default `'draft'`), `view_count` (integer, default 0), `published_at` (timestamptz, nullable), `created_at` (timestamptz, default now()), `updated_at` (timestamptz, default now()).

#### Scenario: Status constraint
- **WHEN** inserting a news row with `status` not in `['draft', 'published', 'archived']`
- **THEN** Supabase SHALL reject with a check constraint violation

#### Scenario: view_count cannot be set by client
- **WHEN** a Supabase client with anon key attempts to UPDATE `view_count` directly
- **THEN** RLS SHALL block the update

### Requirement: RLS is enabled on both tables
Row Level Security SHALL be enabled on `categories` and `news` to ensure data access is controlled.

#### Scenario: Public read for published news
- **WHEN** an anonymous user queries `news` table
- **THEN** only rows with `status = 'published'` SHALL be returned

#### Scenario: Public read for categories
- **WHEN** an anonymous user queries `categories` table
- **THEN** all categories SHALL be readable

#### Scenario: Non-admin authenticated users cannot mutate admin-managed content
- **WHEN** an authenticated user without admin role attempts INSERT, UPDATE, or DELETE on `news` or `categories`
- **THEN** RLS SHALL deny the operation

#### Scenario: Admin users can mutate admin-managed content
- **WHEN** an authenticated user with admin role queries `news` or `categories` for INSERT, UPDATE, or DELETE operations
- **THEN** RLS SHALL allow the operation

#### Scenario: Non-admin authenticated users cannot read draft or archived news
- **WHEN** an authenticated user without admin role queries `news`
- **THEN** rows with `status IN ('draft', 'archived')` SHALL not be returned

#### Scenario: Admin users can read all news statuses
- **WHEN** an authenticated user with admin role queries `news`
- **THEN** rows with `status = 'draft'`, `status = 'published'`, and `status = 'archived'` SHALL all be readable

### Requirement: App DTOs have mapped types for categories and news
`app/types/category.ts` and `app/types/news.ts` SHALL define app-level DTO interfaces distinct from raw Supabase row types.

#### Scenario: Category DTO maps to API shape
- **WHEN** `CategoryDto` is used in a composable
- **THEN** it SHALL have `id`, `name`, `slug`, `createdAt` (camelCase) fields

#### Scenario: News DTO maps to API shape
- **WHEN** `NewsDto` is used in a composable
- **THEN** it SHALL have `id`, `title`, `slug`, `summary`, `content`, `thumbnailUrl`, `categoryId`, `category`, `authorId`, `status`, `viewCount`, `publishedAt`, `createdAt` (camelCase) fields

### Requirement: view_count_jobs table has required columns
The `view_count_jobs` table SHALL have: `id` (uuid PK), `news_id` (uuid, not null, FK → news.id ON DELETE CASCADE), `status` (text, not null, default `'pending'`, check IN `['pending', 'processing', 'completed', 'failed']`), `attempt_count` (integer, not null, default 0), `last_error` (text, nullable), `created_at` (timestamptz, default now()), `started_at` (timestamptz, nullable), `finished_at` (timestamptz, nullable).

#### Scenario: RLS blocks public access
- **WHEN** an anon, public, or authenticated (non-service-role) client queries `view_count_jobs`
- **THEN** all operations SHALL be denied — only `service_role` has access

#### Scenario: Atomic job claiming via stored function
- **WHEN** `claim_pending_view_count_jobs(batch_size)` is called
- **THEN** it SHALL atomically SELECT FOR UPDATE SKIP LOCKED up to `batch_size` pending rows and flip their status to `processing` in a single statement

#### Scenario: Cascading delete
- **WHEN** a `news` row is deleted
- **THEN** all associated `view_count_jobs` rows SHALL be deleted automatically

### Requirement: import_batches table has required columns
The `import_batches` table SHALL have: `id` (uuid PK), `created_by` (uuid, nullable, FK → auth.users.id ON DELETE SET NULL), `category_id` (uuid, not null, FK → categories.id), `source_count` (integer, not null, check >= 0), `status` (text, not null, default `'pending'`, check IN `['pending', 'processing', 'completed', 'completed_with_failures', 'failed']`), `failure_email_sent_at` (timestamptz, nullable), `created_at` (timestamptz, default now()), `updated_at` (timestamptz, default now()).

#### Scenario: RLS admin-only for import_batches
- **WHEN** an anon or non-admin authenticated user queries `import_batches`
- **THEN** SELECT, INSERT, UPDATE, DELETE SHALL all be denied
- **WHEN** an admin user queries `import_batches`
- **THEN** all operations SHALL be permitted

### Requirement: import_items table has required columns
The `import_items` table SHALL have: `id` (uuid PK), `batch_id` (uuid, not null, FK → import_batches.id ON DELETE CASCADE), `source_url` (text, not null), `status` (text, not null, default `'pending'`, check IN `['pending', 'processing', 'published', 'failed']`), `attempt_count` (integer, not null, default 0, check >= 0), `next_retry_at` (timestamptz, not null, default now()), `last_error` (text, nullable), `news_id` (uuid, nullable, FK → news.id ON DELETE SET NULL), `started_at` (timestamptz, nullable), `finished_at` (timestamptz, nullable), `created_at` (timestamptz, default now()), `updated_at` (timestamptz, default now()). A unique constraint SHALL exist on `(batch_id, source_url)`.

#### Scenario: Duplicate source_url within same batch rejected
- **WHEN** inserting an `import_items` row with a `source_url` already present in the same batch
- **THEN** Supabase SHALL reject with a unique constraint violation

#### Scenario: RLS admin-only for import_items
- **WHEN** an anon or non-admin authenticated user queries `import_items`
- **THEN** SELECT, INSERT, UPDATE, DELETE SHALL all be denied

### Requirement: import_dlq_items table has required columns
The `import_dlq_items` table SHALL have: `id` (uuid PK), `item_id` (uuid, not null, FK → import_items.id), `batch_id` (uuid, not null, FK → import_batches.id), `source_url` (text, not null), `failure_reason` (text, not null), `attempt_count` (integer, not null), `payload_snapshot` (jsonb, nullable — partial article data extracted before failure), `created_at` (timestamptz, default now()).

#### Scenario: RLS admin-only for import_dlq_items
- **WHEN** an anon or non-admin authenticated user queries `import_dlq_items`
- **THEN** SELECT and INSERT SHALL be denied

#### Scenario: payload_snapshot is nullable
- **WHEN** a scrape fails before any article data is extracted (e.g., HTTP error)
- **THEN** `payload_snapshot` SHALL be NULL
