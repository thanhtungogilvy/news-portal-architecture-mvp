## ADDED Requirements

### Requirement: Authenticated clients can fetch current session identity
The system SHALL provide `GET /api/auth/me` to return a safe app-level representation of the current authenticated user.

#### Scenario: Authenticated user fetches session
- **WHEN** an authenticated user requests `GET /api/auth/me`
- **THEN** the API SHALL return a success response containing the user's `id`, `email`, and admin entitlement fields

#### Scenario: Unauthenticated request rejected
- **WHEN** an unauthenticated user requests `GET /api/auth/me`
- **THEN** the API SHALL return `UNAUTHENTICATED`

### Requirement: Session payload exposes admin entitlement for admin surfaces
The system SHALL derive admin entitlement from Supabase Auth role metadata and expose it in the `GET /api/auth/me` response.

#### Scenario: Admin user
- **WHEN** `GET /api/auth/me` is called for an authenticated user whose role metadata is `admin`
- **THEN** the response SHALL indicate that the user has admin access

#### Scenario: Non-admin user
- **WHEN** `GET /api/auth/me` is called for an authenticated user without admin role metadata
- **THEN** the response SHALL indicate that the user does not have admin access
