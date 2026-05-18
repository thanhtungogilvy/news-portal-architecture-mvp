## ADDED Requirements

### Requirement: Admins can list categories for content management
The system SHALL provide `GET /api/admin/categories` for authenticated admins to retrieve categories for admin workflows.

#### Scenario: Admin lists categories
- **WHEN** an authenticated admin requests `GET /api/admin/categories`
- **THEN** the API SHALL return all categories in a stable order suitable for admin tables and selectors

#### Scenario: Non-admin access denied
- **WHEN** an unauthenticated user or authenticated non-admin requests `GET /api/admin/categories`
- **THEN** the API SHALL reject the request with `UNAUTHENTICATED` or `FORBIDDEN`

### Requirement: Admins can fetch a single category by ID
The system SHALL provide `GET /api/admin/categories/:id` for authenticated admins to retrieve one category by UUID for editor initialization.

#### Scenario: Existing category
- **WHEN** an authenticated admin requests `GET /api/admin/categories/:id` with an existing category UUID
- **THEN** the API SHALL return the category record

#### Scenario: Missing category
- **WHEN** an authenticated admin requests `GET /api/admin/categories/:id` with a non-existent category UUID
- **THEN** the API SHALL return `NOT_FOUND`

### Requirement: Admins can create categories
The system SHALL provide `POST /api/admin/categories` for authenticated admins to create categories with validated `name` and `slug`.

#### Scenario: Create category
- **WHEN** an authenticated admin submits valid category input
- **THEN** the API SHALL create the category and return it in the success response

#### Scenario: Duplicate slug rejected
- **WHEN** an authenticated admin submits category input whose slug already exists
- **THEN** the API SHALL return `CONFLICT`

### Requirement: Admins can update categories
The system SHALL provide `PATCH /api/admin/categories/:id` for authenticated admins to update existing category records.

#### Scenario: Update category
- **WHEN** an authenticated admin submits valid patch input for an existing category UUID
- **THEN** the API SHALL persist the changes and return the updated category record

#### Scenario: Patch missing category
- **WHEN** an authenticated admin patches a non-existent category UUID
- **THEN** the API SHALL return `NOT_FOUND`

### Requirement: Admins can delete categories
The system SHALL provide `DELETE /api/admin/categories/:id` for authenticated admins to delete category records.

#### Scenario: Delete existing category
- **WHEN** an authenticated admin requests `DELETE /api/admin/categories/:id` for an existing category UUID
- **THEN** the API SHALL delete the category and return a success envelope

#### Scenario: Deleting category preserves existing news rows
- **WHEN** an authenticated admin deletes a category that is referenced by existing news rows
- **THEN** the category SHALL be deleted and the affected news rows SHALL remain with `category_id = null`
