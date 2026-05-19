## ADDED Requirements

### Requirement: Public reading pages provide a unified shell
The system SHALL render public reading pages inside a unified shell with a restrained top navigation, consistent public page framing, and a footer aligned with the Apple-inspired reading system.

#### Scenario: Public reading shell on default layout
- **WHEN** a public page using the default layout is rendered
- **THEN** it SHALL display the shared public reading header and footer with minimal chrome and consistent spacing rhythm

#### Scenario: Shell supports responsive reading navigation
- **WHEN** the public shell is rendered on mobile, tablet, or desktop
- **THEN** navigation and page framing SHALL remain readable, touch-safe, and visually restrained without obscuring content

### Requirement: Public reading shell preserves current application architecture
The public reading shell SHALL remain a presentation-layer enhancement over the current Nuxt layout and SHALL NOT require new business-data endpoints.

#### Scenario: Shell implementation
- **WHEN** the shell is implemented
- **THEN** the page structure SHALL continue to use the current layout system, current composables, and existing `server/api` flows
