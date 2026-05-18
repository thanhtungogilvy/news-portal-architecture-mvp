## ADDED Requirements

### Requirement: Auth store manages session state
`app/stores/auth.ts` SHALL expose `user` (ref to Supabase User | null) and computed `isAuthenticated` (boolean).

#### Scenario: Unauthenticated state
- **WHEN** no Supabase session exists
- **THEN** `user` SHALL be null and `isAuthenticated` SHALL be false

#### Scenario: Authenticated state
- **WHEN** a valid Supabase session exists
- **THEN** `user` SHALL be populated and `isAuthenticated` SHALL be true

### Requirement: Auth route middleware protects authenticated routes
`app/middleware/auth.ts` SHALL redirect unauthenticated users to `/login`.

#### Scenario: Unauthenticated access to protected route
- **WHEN** user navigates to a route with `definePageMeta({ middleware: 'auth' })`
- **AND** no valid session exists
- **THEN** navigation SHALL redirect to `/login`

#### Scenario: Authenticated access to protected route
- **WHEN** user navigates to a protected route with a valid session
- **THEN** navigation SHALL proceed normally

### Requirement: Guest route middleware redirects authenticated users
`app/middleware/guest.ts` SHALL redirect authenticated users away from guest-only pages (login, register) to `/`.

#### Scenario: Authenticated user on login page
- **WHEN** authenticated user navigates to `/login`
- **THEN** navigation SHALL redirect to `/`

#### Scenario: Unauthenticated user on login page
- **WHEN** unauthenticated user navigates to `/login`
- **THEN** navigation SHALL proceed normally

### Requirement: useAuth composable exposes auth operations
`app/composables/auth/useAuth.ts` SHALL expose `signIn(email, password)`, `signOut()`, and proxy `user` + `isAuthenticated` from store.

#### Scenario: Successful sign in
- **WHEN** `signIn(email, password)` is called with valid credentials
- **THEN** Supabase session SHALL be established and `isAuthenticated` SHALL become true

#### Scenario: Failed sign in
- **WHEN** `signIn(email, password)` is called with invalid credentials
- **THEN** the function SHALL throw an error with the Supabase error message

#### Scenario: Sign out
- **WHEN** `signOut()` is called
- **THEN** Supabase session SHALL be cleared and `isAuthenticated` SHALL become false
