## Requirements

### Requirement: Scraping jobs retry with exponential backoff
The scraping worker SHALL retry failed import jobs up to 3 times with exponential backoff before treating them as terminal failures.

#### Scenario: Transient scrape failure
- **WHEN** a scrape job fails before exhausting retry attempts
- **THEN** the system SHALL reschedule the job with exponential backoff

#### Scenario: Retry limit exhausted
- **WHEN** a scrape job fails on its final allowed attempt
- **THEN** the related import item SHALL be marked failed with persisted error details
- **AND** the terminal failure SHALL be recorded in `import_dlq_items`

#### Scenario: Non-retriable error
- **WHEN** a scrape job fails with a non-retriable error (HTTP 4xx, content extraction failure)
- **THEN** the system SHALL skip retries and immediately mark the item as terminal failure

### Requirement: Terminal failures enter DLQ handling and emit Resend alerts
The system SHALL process terminal scrape failures through a DLQ handling path and emit a Resend alert email with operational context.

#### Scenario: DLQ alert
- **WHEN** an import item reaches terminal failure after all retries
- **THEN** the system SHALL handle it through the DLQ path
- **AND** an alert email SHALL be sent via Resend including batch ID, item ID, source URL, and failure context

#### Scenario: One failure email per batch
- **WHEN** a batch has multiple terminal item failures
- **THEN** the system SHALL send at most one consolidated alert email for that batch
- **AND** the batch SHALL persist `failure_email_sent_at` after the email is sent

#### Scenario: Completion email for all terminal statuses
- **WHEN** a batch reaches `completed`, `failed`, or `completed_with_failures` status
- **THEN** the system SHALL send a consolidated alert email (not only on failure)

### Requirement: Successful scraping publishes sanitized content
The scraping worker SHALL sanitize extracted content and create a published news record through the existing service/repository architecture.

#### Scenario: Successful scrape
- **WHEN** a queued import item is fetched and parsed successfully
- **THEN** the worker SHALL sanitize extracted content
- **AND** create a published news record
- **AND** mark the import item as published with a linked news record

### Requirement: Import deduplication prevents duplicate articles
The system SHALL detect and skip duplicate imports at two layers: source URL and generated slug.

#### Scenario: Duplicate source URL
- **WHEN** an import item source URL was already published in a previous batch
- **THEN** the worker SHALL reuse the existing news record and mark the item as published without creating a duplicate

#### Scenario: Duplicate slug
- **WHEN** a generated slug from the article title already exists in the news table
- **THEN** the worker SHALL reuse the existing news record and mark the item as published without creating a duplicate

### Requirement: Stuck processing items are recovered automatically
The system SHALL detect import items stuck in `processing` state beyond a timeout and recover them to a terminal failed state.

#### Scenario: Stuck item recovery
- **WHEN** an import item has been in `processing` state for more than 5 minutes
- **THEN** the system SHALL mark it as failed, record it in `import_dlq_items`, and sync the batch status
