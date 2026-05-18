## ADDED Requirements

### Requirement: PublishedAt auto-fills on first publish
When an editor sets the article status to `published` and the `publishedAt` field is currently empty, the system SHALL automatically populate `publishedAt` with the current UTC timestamp. The editor SHALL be able to override this value manually after auto-fill.

#### Scenario: Auto-fill on status change to published
- **WHEN** the editor changes status to `published`
- **AND** the `publishedAt` field is empty or null
- **THEN** `publishedAt` SHALL be set to the current UTC timestamp in ISO 8601 format

#### Scenario: No overwrite when publishedAt already set
- **WHEN** the editor changes status to `published`
- **AND** `publishedAt` already has a value
- **THEN** `publishedAt` SHALL NOT be changed

#### Scenario: No auto-fill for draft or archived
- **WHEN** the editor changes status to `draft` or `archived`
- **THEN** `publishedAt` SHALL NOT be auto-populated

#### Scenario: Manual override after auto-fill
- **WHEN** `publishedAt` has been auto-filled
- **THEN** the editor SHALL be able to edit the `publishedAt` field directly and the manual value SHALL be used
