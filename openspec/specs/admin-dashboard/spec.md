### Requirement: Admin dashboard displays summary navigation cards
The admin index page at `/admin` SHALL display a page header and summary cards linking to the news management and categories management sections.

#### Scenario: Dashboard renders with navigation cards
- **WHEN** an authenticated admin navigates to `/admin`
- **THEN** the page SHALL display a welcome header and at least two summary cards: one for news and one for categories

#### Scenario: Navigation cards link to correct routes
- **WHEN** the admin clicks the news summary card
- **THEN** the browser SHALL navigate to `/admin/news`

#### Scenario: Navigation cards link to correct routes (categories)
- **WHEN** the admin clicks the categories summary card
- **THEN** the browser SHALL navigate to `/admin/categories`

### Requirement: Admin dashboard is protected by auth guard
The admin dashboard page SHALL apply the `auth` middleware to prevent unauthenticated access.

#### Scenario: Unauthenticated access redirected
- **WHEN** an unauthenticated user navigates to `/admin`
- **THEN** the middleware SHALL redirect the user to `/admin/login`
