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
