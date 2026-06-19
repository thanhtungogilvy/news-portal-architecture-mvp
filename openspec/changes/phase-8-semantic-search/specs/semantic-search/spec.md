## ADDED Requirements

### Requirement: Search API accepts query and optional category filter
`GET /api/search` SHALL accept `q` (required, non-empty string) and `category` (optional, category slug string) query parameters.

#### Scenario: Valid query without category
- **WHEN** client calls `GET /api/search?q=trí tuệ nhân tạo`
- **THEN** server SHALL return HTTP 200 with `{ data: [...] }` containing semantically ranked article results

#### Scenario: Valid query with category filter
- **WHEN** client calls `GET /api/search?q=AI&category=technology`
- **THEN** server SHALL return HTTP 200 with results filtered to articles in the `technology` category

#### Scenario: Missing query param
- **WHEN** client calls `GET /api/search` without `q`
- **THEN** server SHALL return HTTP 400 with a validation error

#### Scenario: LM Studio unavailable
- **WHEN** LM Studio is not reachable and client calls `GET /api/search?q=test`
- **THEN** server SHALL return HTTP 503 with `{ error: "AI_UNAVAILABLE", message: "..." }`

---

### Requirement: Search results include similarity score
Each result item in the search response SHALL include a `score` field (number between 0 and 1) representing cosine similarity to the query embedding.

#### Scenario: Results are ordered by score descending
- **WHEN** search returns multiple results
- **THEN** results SHALL be ordered from highest to lowest similarity score

#### Scenario: Score field present on all results
- **WHEN** any search result is returned
- **THEN** each item SHALL have fields: `id`, `title`, `slug`, `summary`, `thumbnailUrl`, `category`, `score`

---

### Requirement: Search page exists at /search
`app/pages/search.vue` SHALL render a search input, results grid, and handle loading, empty, and error states.

#### Scenario: Loading state
- **WHEN** search API call is in flight
- **THEN** page SHALL show a loading indicator and not show stale results

#### Scenario: Empty state
- **WHEN** search returns zero results
- **THEN** page SHALL show an empty state message (not a blank page)

#### Scenario: Error state (LM Studio down)
- **WHEN** search API returns 503
- **THEN** page SHALL show a user-friendly error message indicating AI features are temporarily unavailable

#### Scenario: URL-synced query
- **WHEN** user types a query and results load
- **THEN** the URL SHALL update to `/search?q=<query>` so the search is shareable

---

### Requirement: Search entry point in public header
The public site header SHALL include a search icon or input that navigates to `/search`.

#### Scenario: User clicks search icon
- **WHEN** user clicks the search icon in `LayoutHeader`
- **THEN** user SHALL be navigated to `/search` page

---

## UPDATED Requirements (post-implementation)

### Requirement: Search results include both normalized and raw similarity scores
Each result item SHALL include `score` (normalized, top result = 1.0) and `rawScore` (raw cosine similarity from pgvector).

#### Scenario: Score normalization
- **WHEN** search returns multiple results
- **THEN** the top result's `score` SHALL equal 1.0; all others SHALL be scaled proportionally

#### Scenario: Debug mode score breakdown
- **WHEN** URL contains `?debug=1`
- **THEN** page SHALL show a table with Raw % and Normalized % columns for each result

---

### Requirement: Search input only fires API call after user stops typing
The search composable SHALL debounce API calls so the server is not called on every keystroke.

#### Scenario: Typing does not call API per character
- **WHEN** user types continuously
- **THEN** API SHALL NOT be called until user pauses for ≥600ms

#### Scenario: Enter key or button commits search and syncs URL
- **WHEN** user presses Enter or clicks the search button
- **THEN** URL SHALL update to `/search?q=<query>` AND API SHALL be called immediately (no debounce wait)

---

### Requirement: Similarity filter is applied at SQL level
The `match_article_embeddings` RPC SHALL accept a `min_similarity` parameter to filter results at the database level. No hard row limit is applied by default.

#### Scenario: min_similarity filters irrelevant articles
- **WHEN** `min_similarity=0.40` is passed
- **THEN** only articles with cosine similarity ≥ 0.40 to the query SHALL be returned

---

### Requirement: Embedding vector dimension matches model output
The `article_embeddings.embedding` column SHALL match the output dimensions of the configured LM Studio model. Switching models requires a migration to resize the column, truncate old embeddings, and reset jobs.

---

### Requirement: Embedding index uses HNSW for incremental correctness
The vector similarity index SHALL use HNSW (not IVFFlat) to avoid the empty-table centroid bug where IVFFlat built on an empty table returns zero results for all queries.

---

### Requirement: Embedding text includes up to 2000 characters of article content
When building embedding text, article content (HTML-stripped) SHALL be capped at 2000 characters (not 500) to improve recall for queries referencing content deeper in the article.
