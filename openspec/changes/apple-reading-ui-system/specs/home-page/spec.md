## MODIFIED Requirements

### Requirement: Home page displays featured news section
The home page (`/`) SHALL display featured news from GET `/api/news/featured` using an Apple-inspired lead-story composition with a photography-first top story and restrained supporting-story layout.

#### Scenario: Successful load
- **WHEN** the home page is visited
- **THEN** up to 6 featured stories SHALL be rendered with a clearly dominant lead story, supporting stories, title hierarchy, thumbnail treatment, category context, and published metadata

#### Scenario: Loading state
- **WHEN** the featured news data is pending
- **THEN** skeleton placeholders SHALL preserve the intended lead-story and supporting-story layout without significant layout shift

#### Scenario: Empty result
- **WHEN** GET `/api/news/featured` returns an empty array
- **THEN** the featured-news area SHALL display a calm empty state consistent with the public reading theme

### Requirement: Home page displays most-viewed news section
The home page SHALL display a "Most Viewed" section from GET `/api/news/most-viewed` using the same public reading design language while remaining visually secondary to the featured-news area.

#### Scenario: Successful load
- **WHEN** the home page is visited
- **THEN** up to 6 most-viewed stories SHALL be rendered in a scan-friendly layout that feels consistent with the new home-page system

#### Scenario: Loading state
- **WHEN** the most-viewed data is pending
- **THEN** skeleton placeholders SHALL be rendered in the intended most-viewed layout

#### Scenario: Empty result
- **WHEN** GET `/api/news/most-viewed` returns an empty array
- **THEN** the section SHALL display an empty-state message rather than an empty list

### Requirement: Home page uses the shared public reading shell
The home page SHALL use the default layout and the shared public reading shell.

#### Scenario: Layout applied
- **WHEN** the home page is rendered
- **THEN** the shared public reading header and footer SHALL frame the page
