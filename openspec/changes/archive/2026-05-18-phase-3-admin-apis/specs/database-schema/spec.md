## MODIFIED Requirements

### Requirement: RLS is enabled on both tables
Row Level Security SHALL be enabled on `categories` and `news` to ensure data access is controlled.

#### Scenario: Public read for published news
- **WHEN** an anonymous user queries `news` table
- **THEN** only rows with `status = 'published'` SHALL be returned

#### Scenario: Public read for categories
- **WHEN** an anonymous user queries `categories` table
- **THEN** all categories SHALL be readable

#### Scenario: Non-admin authenticated users cannot mutate admin-managed content
- **WHEN** an authenticated user without admin role attempts INSERT, UPDATE, or DELETE on `news` or `categories`
- **THEN** RLS SHALL deny the operation

#### Scenario: Admin users can mutate admin-managed content
- **WHEN** an authenticated user with admin role queries `news` or `categories` for INSERT, UPDATE, or DELETE operations
- **THEN** RLS SHALL allow the operation

#### Scenario: Non-admin authenticated users cannot read draft or archived news
- **WHEN** an authenticated user without admin role queries `news`
- **THEN** rows with `status IN ('draft', 'archived')` SHALL not be returned

#### Scenario: Admin users can read all news statuses
- **WHEN** an authenticated user with admin role queries `news`
- **THEN** rows with `status = 'draft'`, `status = 'published'`, and `status = 'archived'` SHALL all be readable
