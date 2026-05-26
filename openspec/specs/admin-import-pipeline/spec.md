## Requirements

### Requirement: Admins can submit bulk import batches
The system SHALL provide `POST /api/admin/import/bulk` for authenticated admins to submit up to 100 source URLs, assign a target category, create import batch/item records, create pending scraping jobs, and return HTTP 202 immediately.

#### Scenario: Valid bulk import request
- **WHEN** an authenticated admin submits 1 to 100 valid source URLs and a valid category
- **THEN** the API SHALL create one import batch and one import item per accepted URL
- **AND** each import item SHALL be persisted in a pending state for worker pickup
- **AND** the response SHALL be HTTP 202 with the created batch identifier

#### Scenario: Too many URLs
- **WHEN** an authenticated admin submits more than 100 URLs
- **THEN** the API SHALL reject the request with `VALIDATION_ERROR`

#### Scenario: Non-admin denied
- **WHEN** a non-admin or unauthenticated user submits `POST /api/admin/import/bulk`
- **THEN** the API SHALL reject the request with `UNAUTHENTICATED` or `FORBIDDEN`

### Requirement: Admins can crawl a listing page to discover article URLs
The system SHALL provide `POST /api/admin/import/crawl` for authenticated admins to submit a listing page URL, automatically discover article links via heuristic CSS selectors, and create an import batch for the discovered URLs.

#### Scenario: Valid crawl request
- **WHEN** an authenticated admin submits a valid listing URL with optional maxItems (1-100, default 20)
- **THEN** the API SHALL fetch the listing page, extract article hrefs, and create an import batch
- **AND** the response SHALL be HTTP 202 with the batch identifier and accepted count

#### Scenario: Crawl with maxItems
- **WHEN** an authenticated admin submits maxItems = 10
- **THEN** the system SHALL limit discovered articles to at most 10

### Requirement: Admins can monitor import batch progress
The system SHALL provide admin progress views for import batches and items, including Pending, Processing, Published, and Failed status visibility.

#### Scenario: Batch list
- **WHEN** an authenticated admin opens the import dashboard
- **THEN** the UI SHALL display import batches with aggregate progress counts and overall batch status

#### Scenario: Batch detail
- **WHEN** an authenticated admin opens an import batch detail view
- **THEN** the UI SHALL display per-item status, source URL, and failure details when present

#### Scenario: Batch status auto-refresh
- **WHEN** a batch has active (pending or processing) items
- **THEN** the UI SHALL auto-poll every 5 seconds and stop when the batch reaches terminal status

#### Scenario: Batch failure alert deduplication
- **WHEN** a batch already has `failure_email_sent_at` populated
- **THEN** the system SHALL NOT send another operational failure email for the same batch automatically
