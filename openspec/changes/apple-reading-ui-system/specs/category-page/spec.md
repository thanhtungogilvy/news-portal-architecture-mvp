## MODIFIED Requirements

### Requirement: Category page displays paginated news for a given category
The category page (`/categories/:slug`) SHALL render category-filtered news via GET `/api/news?category=<slug>&page=<n>` using the same Apple-inspired public reading system.

#### Scenario: Valid category with news
- **WHEN** `/categories/technology` is visited and the category has published news
- **THEN** the page SHALL render up to 10 matching stories with a category header, consistent list treatment, and pagination

#### Scenario: Loading state
- **WHEN** the page data is pending
- **THEN** skeleton placeholders SHALL preserve the intended category page layout

#### Scenario: Empty category
- **WHEN** the category exists but has no published news
- **THEN** the page SHALL display a useful empty-state message and next action

#### Scenario: Non-existent category slug
- **WHEN** `/categories/does-not-exist` is visited
- **THEN** the page SHALL display a user-facing not-found state without redirecting

### Requirement: Category navigation shows all categories
The `CategoryNav` component SHALL fetch all categories and render them with restrained active/inactive states aligned to the public reading shell.

#### Scenario: Categories loaded
- **WHEN** `CategoryNav` is rendered
- **THEN** all categories SHALL appear as clickable navigation options

#### Scenario: Active category highlighted
- **WHEN** the current category context matches a rendered category option
- **THEN** that option SHALL render as active
