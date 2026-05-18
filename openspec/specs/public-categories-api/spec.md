## ADDED Requirements

### Requirement: GET /api/categories returns all categories
The endpoint SHALL return all categories as an array wrapped in `ApiSuccess`.

#### Scenario: Successful fetch
- **WHEN** GET /api/categories is called
- **THEN** response SHALL be `{ data: CategoryDto[] }` with HTTP 200

#### Scenario: Empty result
- **WHEN** no categories exist in the database
- **THEN** response SHALL be `{ data: [] }` with HTTP 200

### Requirement: GET /api/categories/:slug returns single category
The endpoint SHALL return a single category by slug.

#### Scenario: Found
- **WHEN** GET /api/categories/:slug is called with a valid slug
- **THEN** response SHALL be `{ data: CategoryDto }` with HTTP 200

#### Scenario: Not found
- **WHEN** GET /api/categories/:slug is called with a non-existent slug
- **THEN** response SHALL return `NOT_FOUND` error with HTTP 404
