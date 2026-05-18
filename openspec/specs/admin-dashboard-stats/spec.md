### Requirement: Admin dashboard displays live content statistics
The dashboard page SHALL fetch and display four stat cards showing current counts: Total Articles, Published, Drafts, and Total Categories. Counts SHALL be sourced from a dedicated `GET /api/admin/stats` endpoint that returns aggregated counts in a single request.

#### Scenario: Stats load on dashboard mount
- **WHEN** an admin navigates to `/admin`
- **THEN** four stat cards SHALL be rendered: Total Articles, Published, Drafts, Categories
- **AND** each card SHALL display the correct current count from the database

#### Scenario: Stats loading state
- **WHEN** the stats fetch is pending
- **THEN** each stat card value area SHALL show a skeleton placeholder

#### Scenario: Published and Draft cards are navigable
- **WHEN** admin clicks the Published stat card
- **THEN** the browser SHALL navigate to `/admin/news?status=published`
- **WHEN** admin clicks the Draft stat card
- **THEN** the browser SHALL navigate to `/admin/news?status=draft`

#### Scenario: Stats endpoint requires authentication
- **WHEN** an unauthenticated request is made to `GET /api/admin/stats`
- **THEN** the API SHALL return `UNAUTHENTICATED`

#### Scenario: Dashboard shows quick-action buttons
- **WHEN** an admin views the dashboard
- **THEN** a "New Article" button linking to `/admin/news/create` SHALL be visible
- **AND** a "New Category" button linking to `/admin/categories/create` SHALL be visible
