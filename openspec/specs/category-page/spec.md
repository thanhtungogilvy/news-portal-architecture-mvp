## ADDED Requirements

### Requirement: Category page displays paginated news for a given category
The category page (`/categories/:slug`) SHALL fetch and display news articles filtered to the given category slug via GET /api/news?category=<slug>&page=<n>. Pagination controls SHALL allow navigating between pages.

#### Scenario: Valid category with news
- **WHEN** `/categories/technology` is visited and the category has published news
- **THEN** up to 10 news cards SHALL be rendered for page 1, with the category name as the page heading

#### Scenario: Loading state
- **WHEN** the page data is pending
- **THEN** skeleton placeholders SHALL replace news cards

#### Scenario: Empty category
- **WHEN** the category exists but has no published news
- **THEN** an empty-state message SHALL be displayed

#### Scenario: Non-existent category slug
- **WHEN** `/categories/does-not-exist` is visited
- **THEN** the page SHALL display a "Not Found" error state (no redirect)

### Requirement: Category navigation shows all categories
The `CategoryNav` component SHALL fetch all categories via GET /api/categories and render a clickable pill for each. The currently active category SHALL be visually highlighted.

#### Scenario: Categories loaded
- **WHEN** CategoryNav is rendered
- **THEN** all category names SHALL be shown as clickable `<NuxtLink>` pills

#### Scenario: Active category highlighted
- **WHEN** the current route matches a category slug
- **THEN** that category's pill SHALL have active styles applied
