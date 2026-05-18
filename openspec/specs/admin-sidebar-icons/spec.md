### Requirement: Admin sidebar renders an icon alongside each navigation label
The admin layout sidebar SHALL display an SVG icon to the left of each navigation label. Icons SHALL use the same Heroicons outline 24px style as existing action icons in the project.

#### Scenario: Icons visible in sidebar
- **WHEN** an admin views any admin panel page
- **THEN** the sidebar navigation SHALL display an icon next to each of the three items: Dashboard, News, Categories

#### Scenario: Active link icon inherits active color
- **WHEN** a nav link is in its active state (current route matches)
- **THEN** the icon SHALL share the same color as the active label text (full white)

#### Scenario: Inactive link icon inherits inactive color
- **WHEN** a nav link is not active
- **THEN** the icon SHALL share the muted color of the inactive label (white/60)

#### Scenario: Icons are decorative — not announced separately
- **WHEN** a screen reader reads the sidebar navigation
- **THEN** the icon elements SHALL have `aria-hidden="true"` so only the label text is announced
