## ADDED Requirements

### Requirement: API response uses standard envelope
All server API endpoints SHALL return responses using one of two envelope types: `ApiSuccess<T>` for success or `ApiError` for failures.

#### Scenario: Successful response
- **WHEN** an API handler completes successfully
- **THEN** response body SHALL be `{ data: T, meta?: Record<string, unknown> }`

#### Scenario: Error response
- **WHEN** an API handler throws or returns an error
- **THEN** response body SHALL be `{ error: { code: string, message: string, details?: unknown } }`

### Requirement: Error codes are standardized
The system SHALL use a fixed set of error codes across all API endpoints.

#### Scenario: Auth error
- **WHEN** request has no valid session
- **THEN** error code SHALL be `UNAUTHENTICATED` with HTTP 401

#### Scenario: Permission error
- **WHEN** authenticated user lacks permission
- **THEN** error code SHALL be `FORBIDDEN` with HTTP 403

#### Scenario: Not found error
- **WHEN** requested resource does not exist
- **THEN** error code SHALL be `NOT_FOUND` with HTTP 404

#### Scenario: Validation error
- **WHEN** request body fails Zod schema validation
- **THEN** error code SHALL be `VALIDATION_ERROR` with HTTP 422 and `details` containing Zod flatten output

#### Scenario: Conflict error
- **WHEN** operation conflicts with existing data (e.g., duplicate slug)
- **THEN** error code SHALL be `CONFLICT` with HTTP 409

#### Scenario: Internal error
- **WHEN** unexpected server or Supabase error occurs
- **THEN** error code SHALL be `INTERNAL_ERROR` with HTTP 500 and no internal details exposed
