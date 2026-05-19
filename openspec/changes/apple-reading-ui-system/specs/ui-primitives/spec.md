## MODIFIED Requirements

### Requirement: UiButton renders a styled button element
The component SHALL render a `<button>` element with shared button styling aligned to the public reading design system. It SHALL continue to support `variant` prop (`primary` | `secondary` | `ghost` | `destructive`) and `size` prop (`sm` | `md` | `lg`).

#### Scenario: Default render
- **WHEN** `<UiButton>Click me</UiButton>` is used with no props
- **THEN** the button SHALL render using the default primary action styling of the shared public reading theme

#### Scenario: Disabled state
- **WHEN** `disabled` is true
- **THEN** the button SHALL keep the disabled attribute and render an appropriately reduced-emphasis appearance

#### Scenario: Secondary action on reading pages
- **WHEN** `variant="secondary"` is used in public reading UI
- **THEN** the button SHALL render with the restrained alternate action style defined by the shared theme

### Requirement: UiBadge renders a small label chip
The component SHALL render an inline `<span>` with a `color` prop while supporting a restrained badge treatment suitable for public reading pages.

#### Scenario: Render with text
- **WHEN** `<UiBadge>Featured</UiBadge>` is used
- **THEN** a styled chip with the slot content SHALL be rendered

#### Scenario: Primary reading badge
- **WHEN** `color="primary"` is used on a public reading page
- **THEN** the badge SHALL render with a restrained highlighted treatment aligned to the shared theme

### Requirement: UiCard renders a content card container
The component SHALL render a styled card container that can support the calmer, lower-elevation public reading theme.

#### Scenario: Render with content
- **WHEN** `<UiCard>content</UiCard>` is used
- **THEN** it SHALL render a card container that follows the shared surface, border, and radius rules

### Requirement: UiPagination renders restrained public reading controls
The component SHALL render pagination controls with clear current-state indication while remaining visually restrained for public reading pages.

#### Scenario: Current page shown
- **WHEN** pagination is rendered with `currentPage`
- **THEN** the active page SHALL be clearly indicated

#### Scenario: Previous and next disabled
- **WHEN** the current page is the first or last available page
- **THEN** the previous or next control SHALL render as disabled
