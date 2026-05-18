### Requirement: Admin news list page shows all articles in a paginated table
The page at `/admin/news` SHALL display all news records (draft, published, archived) in a sortable table using `AdminNewsTable`. Each row SHALL show title, status badge, category, publication date, and action buttons.

#### Scenario: News list renders with articles
- **WHEN** an authenticated admin navigates to `/admin/news`
- **THEN** the page SHALL display a table of news records fetched from `GET /api/admin/news`

#### Scenario: Status badge reflects article status
- **WHEN** a news row has `status = 'published'`
- **THEN** the table SHALL show a success-colored badge labeled "Published"

#### Scenario: Status badge for draft
- **WHEN** a news row has `status = 'draft'`
- **THEN** the table SHALL show a warning-colored badge labeled "Draft"

#### Scenario: Edit action navigates to edit page
- **WHEN** the admin clicks the Edit button for a news row
- **THEN** the browser SHALL navigate to `/admin/news/[id]`

#### Scenario: Delete action opens confirmation modal
- **WHEN** the admin clicks the Delete button for a news row
- **THEN** a `UiModal` confirmation dialog SHALL appear before the record is deleted

#### Scenario: Confirmed delete removes article and refreshes list
- **WHEN** the admin confirms deletion in the modal
- **THEN** the system SHALL call `DELETE /api/admin/news/:id` and refresh the list

#### Scenario: Create button navigates to create page
- **WHEN** the admin clicks the primary Create Article button
- **THEN** the browser SHALL navigate to `/admin/news/create`

#### Scenario: Loading state shown while fetching
- **WHEN** the news list is loading
- **THEN** the page SHALL display a loading indicator or skeleton rows

### Requirement: Admin news create page allows creating a new article
The page at `/admin/news/create` SHALL render `AdminNewsForm` with an empty form. On valid submission it SHALL call `POST /api/admin/news` and navigate to the list on success.

#### Scenario: Empty form rendered
- **WHEN** an authenticated admin navigates to `/admin/news/create`
- **THEN** the form SHALL be empty and ready for input

#### Scenario: Successful create navigates to list
- **WHEN** the admin submits a valid news form
- **THEN** the system SHALL call `POST /api/admin/news`, show a success feedback, and navigate to `/admin/news`

#### Scenario: Validation errors shown inline
- **WHEN** the admin submits a form with missing required fields
- **THEN** the form SHALL display inline validation errors without calling the API

#### Scenario: Cancel navigates back to list
- **WHEN** the admin clicks Cancel
- **THEN** the browser SHALL navigate to `/admin/news`

### Requirement: Admin news edit page allows updating an existing article
The page at `/admin/news/[id]` SHALL fetch the article by ID and pre-populate `AdminNewsForm`. On valid submission it SHALL call `PATCH /api/admin/news/:id`.

#### Scenario: Form pre-populated with existing data
- **WHEN** an authenticated admin navigates to `/admin/news/[id]`
- **THEN** the form SHALL be pre-filled with the current values from `GET /api/admin/news/:id`

#### Scenario: Successful update shows feedback
- **WHEN** the admin submits a valid edit form
- **THEN** the system SHALL call `PATCH /api/admin/news/:id` and display a success toast

#### Scenario: Not found redirects
- **WHEN** the admin navigates to `/admin/news/[id]` with a non-existent ID
- **THEN** the page SHALL redirect to `/admin/news` or show a not-found message

### Requirement: AdminNewsForm captures all editorial fields
`AdminNewsForm` SHALL expose reactive form fields: title, slug, summary, body (textarea), category (select from categories), status (draft | published | archived), thumbnail_url, and published_at (optional date input).

#### Scenario: Slug auto-generated from title
- **WHEN** the admin types a title and the slug field is empty
- **THEN** the slug field SHALL be auto-populated by converting the title to a URL-safe kebab-case string

#### Scenario: Category select populated from categories list
- **WHEN** the form is rendered
- **THEN** the category select SHALL be populated with all active categories from `GET /api/admin/categories`

#### Scenario: Status select reflects current values
- **WHEN** the form is rendered
- **THEN** the status select SHALL present `draft`, `published`, and `archived` as options

### Requirement: Admin news pages are protected by auth guard
All admin news pages (`/admin/news`, `/admin/news/create`, `/admin/news/[id]`) SHALL apply the `auth` middleware.

#### Scenario: Unauthenticated access redirected
- **WHEN** an unauthenticated user navigates to any admin news page
- **THEN** the middleware SHALL redirect the user to `/admin/login`
