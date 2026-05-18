## ADDED Requirements

### Requirement: News hub page displays all published news
The system SHALL provide a `/news` page that displays all published news articles in a paginated grid, ordered by `published_at` descending.

#### Scenario: Default load
- **WHEN** user navigates to `/news`
- **THEN** system displays all published news in a grid (up to `limit` per page) with pagination controls

#### Scenario: Pagination
- **WHEN** user clicks next/prev page
- **THEN** URL updates to `/news?page=N` and grid shows corresponding articles

### Requirement: Category filter via query param
The system SHALL allow filtering news by category via `?category=<slug>` query param on `/news`.

#### Scenario: Filter by category
- **WHEN** user navigates to `/news?category=the-thao`
- **THEN** system displays only published news in that category

#### Scenario: Clear filter
- **WHEN** user navigates to `/news` (no category param)
- **THEN** system displays all published news regardless of category

#### Scenario: Page resets on category change
- **WHEN** user changes category filter
- **THEN** page resets to 1

### Requirement: Category navigation on news hub
The system SHALL display a `CategoryNav` on `/news` so users can switch between category filters.

#### Scenario: All pill active on /news
- **WHEN** user is on `/news` without `?category=`
- **THEN** "All" pill is active

#### Scenario: Category pill active on /news?category=slug
- **WHEN** user is on `/news?category=the-thao`
- **THEN** "Thể thao" pill is active
