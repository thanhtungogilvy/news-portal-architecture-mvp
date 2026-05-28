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

### Requirement: NewsDetailDto extends NewsDto with adjacent navigation
`app/types/news.ts` SHALL define `NewsDetailDto`, `NewsAdjacentDto`, and `NewsNavigationDto` for the article detail API response.

#### Scenario: NewsAdjacentDto shape
- **WHEN** an adjacent article reference is included in a detail response
- **THEN** it SHALL have `id` (string), `title` (string), `slug` (string), `thumbnailUrl` (string | null), `category` (CategoryDto | null), `publishedAt` (string | null)

#### Scenario: NewsNavigationDto shape
- **WHEN** the navigation field is present on a detail response
- **THEN** it SHALL have `newer: NewsAdjacentDto | null` and `older: NewsAdjacentDto | null`

#### Scenario: NewsDetailDto shape
- **WHEN** `NewsDetailDto` is used in the detail composable
- **THEN** it SHALL extend `NewsDto` with `navigation: NewsNavigationDto`

### Requirement: Import DTOs represent batch and item state
`app/types/import.ts` SHALL define `ImportBatchDto`, `ImportItemDto`, and `ImportBatchDetailDto` for the admin import API responses.

#### Scenario: ImportBatchDto shape
- **WHEN** `ImportBatchDto` is used in an import composable
- **THEN** it SHALL have `id`, `categoryId`, `category` (CategoryDto | null), `createdBy` (string | null), `sourceCount`, `status` (ImportBatchStatus), `counts` (ImportBatchCountsDto with pending/processing/published/failed), `failureEmailSentAt` (string | null), `createdAt`, `updatedAt`

#### Scenario: ImportItemDto shape
- **WHEN** `ImportItemDto` is used in a batch detail composable
- **THEN** it SHALL have `id`, `batchId`, `sourceUrl`, `status` (ImportItemStatus), `attemptCount`, `nextRetryAt`, `lastError` (string | null), `newsId` (string | null), `news` (ImportItemNewsDto | null), `startedAt`, `finishedAt`, `createdAt`, `updatedAt`

#### Scenario: ImportBatchDetailDto shape
- **WHEN** `ImportBatchDetailDto` is used in the batch detail composable
- **THEN** it SHALL extend `ImportBatchDto` with `items: ImportItemDto[]`
