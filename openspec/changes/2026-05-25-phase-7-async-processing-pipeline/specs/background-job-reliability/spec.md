## ADDED Requirements

### Requirement: Scraping jobs retry with exponential backoff
The scraping worker SHALL retry failed import jobs up to 3 times with exponential backoff before treating them as terminal failures.

#### Scenario: Transient scrape failure
- **WHEN** a scrape job fails before exhausting retry attempts
- **THEN** the system SHALL reschedule the job with exponential backoff

#### Scenario: Retry limit exhausted
- **WHEN** a scrape job fails on its final allowed attempt
- **THEN** the related import item SHALL be marked failed with persisted error details

### Requirement: Terminal failures enter DLQ handling and emit SMTP alerts
The system SHALL process terminal scrape failures through a DLQ handling path and emit an SMTP alert email with operational context.

#### Scenario: DLQ alert
- **WHEN** an import item reaches terminal failure after all retries
- **THEN** the system SHALL handle it through the DLQ path
- **AND** an SMTP alert SHALL be sent including batch ID, item ID, source URL, and failure context

### Requirement: Successful scraping publishes sanitized content
The scraping worker SHALL sanitize extracted content and create a published news record through the existing service/repository architecture.

#### Scenario: Successful scrape
- **WHEN** a queued import item is fetched and parsed successfully
- **THEN** the worker SHALL sanitize extracted content
- **AND** create a published news record
- **AND** mark the import item as published with a linked news record
