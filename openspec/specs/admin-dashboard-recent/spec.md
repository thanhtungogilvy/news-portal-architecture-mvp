### Requirement: Admin dashboard displays a recent articles activity feed
The dashboard page SHALL display the 5 most recently updated articles as a compact list below the stat cards. Each row SHALL show the article title, status badge, and relative time since last update.

#### Scenario: Recent articles list renders
- **WHEN** an admin views the dashboard
- **THEN** a list of up to 5 articles SHALL be displayed, ordered by most recently updated first

#### Scenario: Each row shows title, status, and relative time
- **WHEN** a recent article row is rendered
- **THEN** it SHALL display the article title (truncated if long), a status badge matching the article status, and a relative time string (e.g. "2 hours ago")

#### Scenario: Clicking a row navigates to the edit page
- **WHEN** admin clicks a row in the recent articles list
- **THEN** the browser SHALL navigate to `/admin/news/<id>`

#### Scenario: Recent articles loading state
- **WHEN** the recent articles fetch is pending
- **THEN** skeleton rows SHALL be displayed in place of article rows

#### Scenario: Empty state when no articles exist
- **WHEN** no articles have been created yet
- **THEN** the recent articles section SHALL display "No articles yet." instead of an empty list
