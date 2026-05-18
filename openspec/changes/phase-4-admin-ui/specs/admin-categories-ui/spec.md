## ADDED Requirements

### Requirement: Admin categories list page shows all categories in a table
The page at `/admin/categories` SHALL display all categories in a table using `AdminCategoryTable`. Each row SHALL show name, slug, and action buttons (edit, delete).

#### Scenario: Categories list renders
- **WHEN** an authenticated admin navigates to `/admin/categories`
- **THEN** the page SHALL display a table of categories fetched from `GET /api/admin/categories`

#### Scenario: Edit action navigates to edit page
- **WHEN** the admin clicks the Edit button for a category row
- **THEN** the browser SHALL navigate to `/admin/categories/[id]`

#### Scenario: Delete action opens confirmation modal
- **WHEN** the admin clicks the Delete button for a category row
- **THEN** a `UiModal` confirmation dialog SHALL appear before the record is deleted

#### Scenario: Confirmed delete removes category and refreshes list
- **WHEN** the admin confirms deletion in the modal
- **THEN** the system SHALL call `DELETE /api/admin/categories/:id` and refresh the list

#### Scenario: Create button navigates to create page
- **WHEN** the admin clicks the primary Create Category button
- **THEN** the browser SHALL navigate to `/admin/categories/create`

#### Scenario: Loading state shown while fetching
- **WHEN** the categories list is loading
- **THEN** the page SHALL display a loading indicator or skeleton rows

### Requirement: Admin category create page allows creating a new category
The page at `/admin/categories/create` SHALL render `AdminCategoryForm` with an empty form. On valid submission it SHALL call `POST /api/admin/categories` and navigate to the list on success.

#### Scenario: Empty form rendered
- **WHEN** an authenticated admin navigates to `/admin/categories/create`
- **THEN** the form SHALL be empty and ready for input

#### Scenario: Successful create navigates to list
- **WHEN** the admin submits a valid category form
- **THEN** the system SHALL call `POST /api/admin/categories`, show a success feedback, and navigate to `/admin/categories`

#### Scenario: Validation errors shown inline
- **WHEN** the admin submits a form with missing required fields
- **THEN** the form SHALL display inline validation errors without calling the API

#### Scenario: Cancel navigates back to list
- **WHEN** the admin clicks Cancel
- **THEN** the browser SHALL navigate to `/admin/categories`

### Requirement: Admin category edit page allows updating an existing category
The page at `/admin/categories/[id]` SHALL fetch the category by ID and pre-populate `AdminCategoryForm`. On valid submission it SHALL call `PATCH /api/admin/categories/:id`.

#### Scenario: Form pre-populated with existing data
- **WHEN** an authenticated admin navigates to `/admin/categories/[id]`
- **THEN** the form SHALL be pre-filled with the current values from `GET /api/admin/categories/:id`

#### Scenario: Successful update shows feedback
- **WHEN** the admin submits a valid edit form
- **THEN** the system SHALL call `PATCH /api/admin/categories/:id` and display a success toast

#### Scenario: Not found redirects
- **WHEN** the admin navigates to `/admin/categories/[id]` with a non-existent ID
- **THEN** the page SHALL redirect to `/admin/categories` or show a not-found message

### Requirement: AdminCategoryForm captures name and slug
`AdminCategoryForm` SHALL expose reactive form fields: `name` (text input) and `slug` (text input, auto-generated from name).

#### Scenario: Slug auto-generated from name
- **WHEN** the admin types a category name and the slug field is empty
- **THEN** the slug field SHALL be auto-populated by converting the name to URL-safe kebab-case

#### Scenario: Slug can be manually overridden
- **WHEN** the admin manually edits the slug field
- **THEN** the auto-generation SHALL stop and the manually entered value SHALL be preserved

### Requirement: Admin categories pages are protected by auth guard
All admin categories pages (`/admin/categories`, `/admin/categories/create`, `/admin/categories/[id]`) SHALL apply the `auth` middleware.

#### Scenario: Unauthenticated access redirected
- **WHEN** an unauthenticated user navigates to any admin categories page
- **THEN** the middleware SHALL redirect the user to `/admin/login`
