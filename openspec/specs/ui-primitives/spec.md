## ADDED Requirements

### Requirement: UiButton renders a styled button element
The component SHALL render a `<button>` element with Tailwind-based styles. It SHALL support `variant` prop (`primary` | `secondary` | `ghost`) and `size` prop (`sm` | `md` | `lg`).

#### Scenario: Default render
- **WHEN** `<UiButton>Click me</UiButton>` is used with no props
- **THEN** a button element with `variant=primary` and `size=md` styles SHALL be rendered

#### Scenario: Disabled state
- **WHEN** `disabled` prop is true
- **THEN** the button SHALL have `disabled` attribute and reduced opacity styles

### Requirement: UiBadge renders a small label chip
The component SHALL render an inline `<span>` with a `color` prop (`default` | `primary` | `success` | `warning`).

#### Scenario: Render with text
- **WHEN** `<UiBadge>Draft</UiBadge>` is used
- **THEN** a styled chip element with the slot content SHALL be rendered

### Requirement: UiSkeleton renders a loading placeholder block
The component SHALL render a `<div>` with animated pulse styles to indicate loading state. It SHALL accept `class` to allow arbitrary sizing.

#### Scenario: Render as placeholder
- **WHEN** `<UiSkeleton class="h-6 w-48" />` is used
- **THEN** a pulsing gray block of that size SHALL be rendered

### Requirement: UiCard renders a content card container
The component SHALL render a styled `<div>` card with padding, border, and rounded corners. It SHALL expose a default `<slot />`.

#### Scenario: Render with content
- **WHEN** `<UiCard>content</UiCard>` is used
- **THEN** a card container with the slot content SHALL be rendered
