## ADDED Requirements

### Requirement: Admins can list news records for editorial management
The system SHALL provide `GET /api/admin/news` for authenticated admins to retrieve paginated news records across all statuses, with optional filtering for `status` and `category`.

#### Scenario: Admin lists all news
- **WHEN** an authenticated admin requests `GET /api/admin/news?page=1&limit=10`
- **THEN** the API SHALL return a paginated list of news rows including draft, published, and archived records

#### Scenario: Admin filters by status
- **WHEN** an authenticated admin requests `GET /api/admin/news?status=draft`
- **THEN** the API SHALL return only news rows whose status matches the requested value

#### Scenario: Non-admin access denied
- **WHEN** an unauthenticated user or authenticated non-admin requests `GET /api/admin/news`
- **THEN** the API SHALL reject the request with `UNAUTHENTICATED` or `FORBIDDEN`

### Requirement: Admins can fetch a single news record by ID
The system SHALL provide `GET /api/admin/news/:id` for authenticated admins to retrieve a single news record by UUID for editor initialization.

#### Scenario: Existing news record
- **WHEN** an authenticated admin requests `GET /api/admin/news/:id` with an existing news UUID
- **THEN** the API SHALL return the complete news record including draft or archived content

#### Scenario: Missing news record
- **WHEN** an authenticated admin requests `GET /api/admin/news/:id` with a non-existent UUID
- **THEN** the API SHALL return `NOT_FOUND`

### Requirement: Admins can create news records
The system SHALL provide `POST /api/admin/news` for authenticated admins to create news records with validated editorial fields.

#### Scenario: Create draft article
- **WHEN** an authenticated admin submits valid news input with `status = 'draft'`
- **THEN** the API SHALL create the news record and return it in the success response

#### Scenario: Create published article without publishedAt
- **WHEN** an authenticated admin submits valid news input with `status = 'published'` and no `publishedAt`
- **THEN** the system SHALL persist the record with `published_at` set by the server

#### Scenario: Duplicate slug rejected
- **WHEN** an authenticated admin submits news input whose slug already exists
- **THEN** the API SHALL return `CONFLICT`

### Requirement: Admins can update news records
The system SHALL provide `PATCH /api/admin/news/:id` for authenticated admins to update existing news records with validated editorial fields.

#### Scenario: Update article fields
- **WHEN** an authenticated admin submits valid patch input for an existing news UUID
- **THEN** the API SHALL persist the changes and return the updated news record

#### Scenario: Patch missing news record
- **WHEN** an authenticated admin patches a non-existent news UUID
- **THEN** the API SHALL return `NOT_FOUND`

### Requirement: Admins can delete news records
The system SHALL provide `DELETE /api/admin/news/:id` for authenticated admins to remove news records by UUID.

#### Scenario: Delete existing article
- **WHEN** an authenticated admin requests `DELETE /api/admin/news/:id` for an existing news record
- **THEN** the API SHALL delete the record and return a success envelope

#### Scenario: Delete missing article
- **WHEN** an authenticated admin requests `DELETE /api/admin/news/:id` for a non-existent news UUID
- **THEN** the API SHALL return `NOT_FOUND`
