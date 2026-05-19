## ADDED Requirements

### Requirement: Public reading UI uses a shared Apple-inspired theme system
The system SHALL define and apply a shared Apple-inspired public reading theme across public pages, including a restrained color palette, display-focused typography scale, spacing rhythm, radius rules, and a single blue interactive accent.

#### Scenario: Shared public theme applied
- **WHEN** a public reading page is rendered
- **THEN** its surfaces, text hierarchy, links, and actions SHALL follow the shared Apple-inspired theme rather than per-page ad hoc styling

#### Scenario: Theme reflected in shared configuration
- **WHEN** the Apple-inspired reading system is implemented
- **THEN** the project SHALL express the design system through shared config and reusable component styling rather than only through isolated page-local classes

### Requirement: Public reading theme keeps chrome minimal and content-first
The system SHALL prioritize photography, article hierarchy, and reading clarity over decorative interface chrome.

#### Scenario: Public reading surface composition
- **WHEN** a user views a public reading page
- **THEN** the UI SHALL use restrained dividers, limited accent color, and minimal elevation so editorial content remains the primary focus
