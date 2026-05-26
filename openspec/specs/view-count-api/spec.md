## Requirements

### Requirement: POST /api/news/:id/view increments view count atomically
The endpoint SHALL accept public view-recording requests for a valid news UUID, create a pending background-processing job record for the increment, and return HTTP 202 immediately.

#### Scenario: Valid news ID
- **WHEN** POST /api/news/:id/view is called with a valid news UUID
- **THEN** the API SHALL create a pending `view_count_jobs` record to increment `view_count`
- **AND** the response SHALL be HTTP 202 with `{ data: null }`

#### Scenario: Invalid UUID format
- **WHEN** POST /api/news/:id/view is called with a non-UUID string
- **THEN** response SHALL return `VALIDATION_ERROR` with HTTP 422

#### Scenario: No auth required
- **WHEN** POST /api/news/:id/view is called without authentication
- **THEN** the request SHALL be accepted for background processing normally

#### Scenario: Background worker applies increment
- **WHEN** a pending `view_count_jobs` row is processed successfully by the worker
- **THEN** the target news record SHALL have `view_count` incremented by 1 atomically
