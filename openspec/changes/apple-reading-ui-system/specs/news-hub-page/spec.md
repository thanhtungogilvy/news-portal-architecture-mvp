## MODIFIED Requirements

### Requirement: News hub page displays all published news
The system SHALL provide a `/news` page that displays published news in a paginated public reading layout ordered by `published_at` descending.

#### Scenario: Default load
- **WHEN** a user navigates to `/news`
- **THEN** the page SHALL display the current page of published news with a calm page header, consistent list/card presentation, and pagination controls

#### Scenario: Pagination
- **WHEN** a user changes pages
- **THEN** the URL SHALL update to `/news?page=N` and the corresponding articles SHALL be rendered

#### Scenario: Empty result
- **WHEN** the selected page or filter returns no published articles
- **THEN** the page SHALL display an empty-state message consistent with the public reading theme

### Requirement: Category filter via query param
The system SHALL allow filtering the `/news` page by `?category=<slug>` while preserving the shared public reading layout and page framing.

#### Scenario: Filter by category
- **WHEN** a user navigates to `/news?category=the-thao`
- **THEN** only published news in that category SHALL be displayed within the same public reading layout

#### Scenario: Clear filter
- **WHEN** a user navigates to `/news` without a category query param
- **THEN** all published news SHALL be displayed

#### Scenario: Page resets on category change
- **WHEN** the user changes the category filter
- **THEN** pagination SHALL reset to page 1

### Requirement: Category navigation on news hub
The system SHALL display a restrained category navigation on `/news` that matches the shared public reading system.

#### Scenario: All pill active on /news
- **WHEN** a user is on `/news` without a category query param
- **THEN** the "All" option SHALL render as active

#### Scenario: Category pill active on /news?category=slug
- **WHEN** a user is on `/news?category=the-thao`
- **THEN** the matching category option SHALL render as active
