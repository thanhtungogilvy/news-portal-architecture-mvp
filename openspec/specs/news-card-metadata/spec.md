## ADDED Requirements

### Requirement: News listing cards display article metadata including views
The system SHALL render a consistent metadata row on reusable news listing cards that includes the published date and article view count alongside existing article context.

#### Scenario: Listing card with metadata
- **WHEN** a published article is rendered in a news listing card
- **THEN** the card SHALL display the article title and a metadata row containing the published date and view count

#### Scenario: Listing card with category
- **WHEN** the article has a category
- **THEN** the card SHALL continue to display the category badge together with the metadata row

### Requirement: News listing card view counts are formatted for dense layouts
The system SHALL present news-card view counts in a compact, human-readable format suitable for grid and list layouts.

#### Scenario: Large view count
- **WHEN** a news listing card renders a large article view count
- **THEN** the count SHALL be displayed in a compact human-readable format rather than a long raw integer string

#### Scenario: Small view count
- **WHEN** a news listing card renders a small article view count
- **THEN** the count SHALL remain readable and unambiguous in the metadata row
