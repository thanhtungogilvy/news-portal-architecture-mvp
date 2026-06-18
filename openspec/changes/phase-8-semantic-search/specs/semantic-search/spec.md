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
