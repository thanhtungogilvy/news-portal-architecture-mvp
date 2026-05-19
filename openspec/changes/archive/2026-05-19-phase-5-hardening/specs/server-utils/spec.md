## MODIFIED Requirements

### Requirement: Server utils are auto-imported by Nitro
All helpers in `server/utils/` SHALL be auto-imported by Nitro and available in any `server/api/`, `server/services/`, or `server/repositories/` file without explicit import.

#### Scenario: Using requireAuth in handler
- **WHEN** a server API handler calls `requireAuth(event)`
- **THEN** the call SHALL succeed without an explicit import statement

### Requirement: requireAuth throws on unauthenticated request
`requireAuth(event)` SHALL verify the current Supabase session and throw if no valid user exists.

#### Scenario: No session
- **WHEN** request has no valid Supabase session
- **THEN** `requireAuth(event)` SHALL throw `UNAUTHENTICATED` error with HTTP 401

#### Scenario: Valid session
- **WHEN** request has a valid Supabase session
- **THEN** `requireAuth(event)` SHALL return the Supabase `User` object

### Requirement: createApiError produces consistent error shape
`createApiError(statusCode, code, message, details?)` SHALL produce an H3Error with the standard `ApiError` data shape.

#### Scenario: Basic error
- **WHEN** `createApiError(404, 'NOT_FOUND', 'Không tìm thấy')` is called
- **THEN** thrown error SHALL have `statusCode: 404` and `data.error.code: 'NOT_FOUND'`

#### Scenario: Error with details
- **WHEN** `createApiError(422, 'VALIDATION_ERROR', 'Invalid', details)` is called
- **THEN** thrown error SHALL include `data.error.details` equal to the passed details object

### Requirement: Nitro global error handler normalizes unhandled errors
A Nitro `onError` plugin SHALL intercept any unhandled error and ensure the response conforms to the `ApiError` envelope. Well-formed `H3Error` errors (thrown via `createApiError`) SHALL be passed through unchanged; all other errors SHALL be re-wrapped as `INTERNAL_ERROR` with HTTP 500.

#### Scenario: Well-formed H3Error passes through unchanged
- **WHEN** a handler throws an H3Error created by `createApiError`
- **THEN** the response SHALL preserve the original `statusCode`, `code`, and `message`

#### Scenario: Unexpected runtime error is normalized
- **WHEN** an unhandled `Error` escapes a handler (e.g., a Supabase client exception)
- **THEN** the response SHALL be HTTP 500 with `{ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }` and no internal details SHALL be exposed

#### Scenario: Unexpected error is logged server-side
- **WHEN** an unhandled error is caught by the plugin
- **THEN** the original error message and stack SHALL be written to the server console via `console.error` before sending the sanitized response
