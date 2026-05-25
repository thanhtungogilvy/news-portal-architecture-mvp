## ADDED Requirements

### Requirement: Admins can submit bulk import batches
The system SHALL provide `POST /api/admin/import/bulk` for authenticated admins to submit up to 100 source URLs, assign a target category, create import batch/item records, enqueue scraping jobs, and return HTTP 202 immediately.

#### Scenario: Valid bulk import request
- **WHEN** an authenticated admin submits 1 to 100 valid source URLs and a valid category
- **THEN** the API SHALL create one import batch and one import item per accepted URL
- **AND** the API SHALL enqueue a scrape job for each item
- **AND** the response SHALL be HTTP 202 with the created batch identifier

#### Scenario: Too many URLs
- **WHEN** an authenticated admin submits more than 100 URLs
- **THEN** the API SHALL reject the request with `VALIDATION_ERROR`

#### Scenario: Non-admin denied
- **WHEN** a non-admin or unauthenticated user submits `POST /api/admin/import/bulk`
- **THEN** the API SHALL reject the request with `UNAUTHENTICATED` or `FORBIDDEN`

### Requirement: Admins can monitor import batch progress
The system SHALL provide admin progress views for import batches and items, including Pending, Processing, Published, and Failed status visibility.

#### Scenario: Batch list
- **WHEN** an authenticated admin opens the import dashboard
- **THEN** the UI SHALL display import batches with aggregate progress counts and overall batch status

#### Scenario: Batch detail
- **WHEN** an authenticated admin opens an import batch detail view
- **THEN** the UI SHALL display per-item status, source URL, and failure details when present
