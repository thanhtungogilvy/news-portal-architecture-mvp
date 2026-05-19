## MODIFIED Requirements

### Requirement: News listing cards display article metadata including views
The system SHALL render a consistent metadata row on reusable news cards that includes published date and article view count while supporting distinct Apple-inspired lead, supporting, and compact treatments.

#### Scenario: Listing card with metadata
- **WHEN** a published article is rendered in a reusable news card
- **THEN** the card SHALL display the title and a metadata row containing published date and view count

#### Scenario: Listing card with category
- **WHEN** the article has a category
- **THEN** the card SHALL continue to display category context together with the metadata row

#### Scenario: Lead story treatment
- **WHEN** a page renders a lead story
- **THEN** the lead card SHALL use a photography-first layout and stronger text hierarchy than supporting or compact cards

### Requirement: News listing card view counts are formatted for restrained layouts
The system SHALL present card-level view counts in a compact, human-readable format suitable for calm, low-chrome public reading layouts.

#### Scenario: Large view count
- **WHEN** a news card renders a large article view count
- **THEN** the count SHALL use compact formatting rather than a long raw integer string

#### Scenario: Small view count
- **WHEN** a news card renders a small article view count
- **THEN** the count SHALL remain readable and unambiguous
