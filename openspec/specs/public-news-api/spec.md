## ADDED Requirements

### Requirement: GET /api/news returns paginated published news
The endpoint SHALL return published news with offset/limit pagination.

#### Scenario: Default pagination
- **WHEN** GET /api/news is called without query params
- **THEN** response SHALL be `{ data: NewsDto[], meta: { total, page, limit } }` with HTTP 200, default page=1 limit=10

#### Scenario: Filtered by category
- **WHEN** GET /api/news?category=<slug> is called
- **THEN** response SHALL return only news belonging to that category

#### Scenario: Invalid pagination params
- **WHEN** GET /api/news?page=0&limit=999 is called
- **THEN** response SHALL return `VALIDATION_ERROR` with HTTP 422

### Requirement: GET /api/news/featured returns top published news by date
The endpoint SHALL return top N published news ordered by `published_at DESC`.

#### Scenario: Successful fetch
- **WHEN** GET /api/news/featured is called
- **THEN** response SHALL be `{ data: NewsDto[] }` with top 6 most recently published news

### Requirement: GET /api/news/most-viewed returns top published news by views
The endpoint SHALL return top N published news ordered by `view_count DESC`.

#### Scenario: Successful fetch
- **WHEN** GET /api/news/most-viewed is called
- **THEN** response SHALL be `{ data: NewsDto[] }` with top 6 most-viewed published news

### Requirement: GET /api/news/:slug returns single published news article
The endpoint SHALL return a single news article by slug.

#### Scenario: Found and published
- **WHEN** GET /api/news/:slug is called with a valid published news slug
- **THEN** response SHALL be `{ data: NewsDto }` with HTTP 200

#### Scenario: Not found or not published
- **WHEN** GET /api/news/:slug is called with a non-existent or draft slug
- **THEN** response SHALL return `NOT_FOUND` error with HTTP 404
