### Requirement: PublishedAt auto-fills on first publish
When an editor sets the article status to `published` and the `publishedAt` field is currently empty, the system SHALL automatically populate `publishedAt` with the current UTC timestamp on submit.

#### Scenario: Auto-fill on publish submit
- **WHEN** the editor submits the form with status `published`
- **AND** the `publishedAt` field is empty or null
- **THEN** `publishedAt` SHALL be set to the current UTC timestamp in ISO 8601 format

#### Scenario: No overwrite when publishedAt already set
- **WHEN** the editor submits with status `published`
- **AND** `publishedAt` already has a value
- **THEN** `publishedAt` SHALL NOT be changed

#### Scenario: No auto-fill for draft or archived
- **WHEN** the editor submits with status `draft` or `archived`
- **THEN** `publishedAt` SHALL NOT be auto-populated
