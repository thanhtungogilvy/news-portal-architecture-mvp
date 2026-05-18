## ADDED Requirements

### Requirement: POST /api/news/:id/view increments view count atomically
The endpoint SHALL increment `view_count` by 1 for the given news ID using a server-side atomic update.

#### Scenario: Valid news ID
- **WHEN** POST /api/news/:id/view is called with a valid news UUID
- **THEN** `view_count` SHALL be incremented by 1 and response SHALL be HTTP 200 with `{ data: null }`

#### Scenario: Invalid UUID format
- **WHEN** POST /api/news/:id/view is called with a non-UUID string
- **THEN** response SHALL return `VALIDATION_ERROR` with HTTP 422

#### Scenario: Non-existent news ID
- **WHEN** POST /api/news/:id/view is called with a valid UUID that does not exist
- **THEN** response SHALL return `NOT_FOUND` with HTTP 404

#### Scenario: No auth required
- **WHEN** POST /api/news/:id/view is called without authentication
- **THEN** the request SHALL be processed normally — no auth check
