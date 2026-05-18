## ADDED Requirements

### Requirement: Home page displays featured news section
The home page (`/`) SHALL display a "Featured" section populated by GET /api/news/featured. While loading, skeleton placeholders SHALL be shown.

#### Scenario: Successful load
- **WHEN** the home page is visited
- **THEN** up to 6 featured news cards SHALL be rendered with title, thumbnail, category badge, and published date

#### Scenario: Loading state
- **WHEN** the featured news data is pending
- **THEN** skeleton placeholders SHALL be rendered in place of news cards

#### Scenario: Empty result
- **WHEN** GET /api/news/featured returns an empty array
- **THEN** no cards are shown and an empty-state message SHALL be displayed

### Requirement: Home page displays most-viewed news section
The home page SHALL display a "Most Viewed" section populated by GET /api/news/most-viewed. While loading, skeleton placeholders SHALL be shown.

#### Scenario: Successful load
- **WHEN** the home page is visited
- **THEN** up to 6 most-viewed news cards SHALL be rendered

#### Scenario: Loading state
- **WHEN** the most-viewed data is pending
- **THEN** skeleton placeholders SHALL be rendered

### Requirement: Home page uses the default layout
The home page SHALL use the `default` layout which wraps content with LayoutHeader and LayoutFooter.

#### Scenario: Layout applied
- **WHEN** the home page is rendered
- **THEN** LayoutHeader and LayoutFooter SHALL be visible surrounding the page content
