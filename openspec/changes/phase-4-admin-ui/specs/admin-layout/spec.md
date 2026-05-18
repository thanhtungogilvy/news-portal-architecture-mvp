## ADDED Requirements

### Requirement: Admin layout renders a two-column shell for all admin pages
The `admin.vue` Nuxt layout SHALL render a fixed sidebar navigation column and a scrollable main content area. All pages that declare `definePageMeta({ layout: 'admin' })` SHALL use this shell.

#### Scenario: Layout renders sidebar and main content
- **WHEN** an admin page is rendered
- **THEN** the admin layout SHALL display a fixed left sidebar and a `<slot />` main content area

#### Scenario: Sidebar shows navigation links
- **WHEN** the admin layout is rendered
- **THEN** the sidebar SHALL contain navigation links to `/admin`, `/admin/news`, and `/admin/categories`

#### Scenario: Active nav link is visually highlighted
- **WHEN** the current route matches a sidebar link's path
- **THEN** that link SHALL receive an active style distinct from inactive links

#### Scenario: Sidebar shows logged-in user email
- **WHEN** an authenticated admin views any admin page
- **THEN** the sidebar SHALL display the current user's email address

#### Scenario: Logout clears session and redirects
- **WHEN** the admin clicks the logout button in the sidebar
- **THEN** the session SHALL be cleared and the user SHALL be redirected to `/admin/login`
