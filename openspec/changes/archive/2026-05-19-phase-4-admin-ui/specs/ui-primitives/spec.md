## MODIFIED Requirements

### Requirement: UiButton renders a styled button element
The component SHALL render a `<button>` element with Tailwind-based styles. It SHALL support `variant` prop (`primary` | `secondary` | `ghost` | `destructive`) and `size` prop (`sm` | `md` | `lg`).

#### Scenario: Default render
- **WHEN** `<UiButton>Click me</UiButton>` is used with no props
- **THEN** a button element with `variant=primary` and `size=md` styles SHALL be rendered

#### Scenario: Disabled state
- **WHEN** `disabled` prop is true
- **THEN** the button SHALL have `disabled` attribute and reduced opacity styles

#### Scenario: Destructive variant
- **WHEN** `variant="destructive"` is set
- **THEN** the button SHALL render with a red background and white text to signal a destructive action

### Requirement: UiBadge renders a small label chip
The component SHALL render an inline `<span>` with a `color` prop (`default` | `primary` | `success` | `warning` | `danger`).

#### Scenario: Render with text
- **WHEN** `<UiBadge>Draft</UiBadge>` is used
- **THEN** a styled chip element with the slot content SHALL be rendered

#### Scenario: Danger color for archived or inactive state
- **WHEN** `color="danger"` is set
- **THEN** the badge SHALL render with red background and dark red text

## ADDED Requirements

### Requirement: UiInput renders a unified form field
The component SHALL render a labeled form field supporting `type` prop values: `text`, `email`, `url`, `textarea`, and `select`. It SHALL accept `label`, `error`, `modelValue`, and `placeholder` props. Attribute inheritance SHALL be disabled (`inheritAttrs: false`) and attrs SHALL be bound to the inner element.

#### Scenario: Text input render
- **WHEN** `<UiInput type="text" label="Title" />` is used
- **THEN** a visible label and a styled text input SHALL be rendered

#### Scenario: Textarea render
- **WHEN** `<UiInput type="textarea" label="Body" />` is used
- **THEN** a visible label and a styled `<textarea>` element SHALL be rendered

#### Scenario: Select render
- **WHEN** `<UiInput type="select" label="Status" />` is used with a default slot
- **THEN** a visible label and a styled `<select>` element SHALL be rendered with the slot content as options

#### Scenario: Error message shown
- **WHEN** `error` prop contains a non-empty string
- **THEN** the error message SHALL be rendered below the input field in error color

#### Scenario: v-model binding works
- **WHEN** `v-model` is used on `<UiInput />`
- **THEN** the input value SHALL be bound to the parent's reactive state via `modelValue` / `update:modelValue`

### Requirement: UiModal renders a generic confirmation dialog
The component SHALL render a modal overlay with title, body content (slot), and two action buttons: Confirm and Cancel. It SHALL be controlled via `v-model:open` and emit `confirm` and `cancel` events.

#### Scenario: Modal hidden when open is false
- **WHEN** `open` is `false`
- **THEN** the modal overlay SHALL NOT be visible in the DOM or SHALL be hidden

#### Scenario: Modal shown when open is true
- **WHEN** `open` is `true`
- **THEN** the modal overlay SHALL be visible with a backdrop, title, slot content, and action buttons

#### Scenario: Confirm button emits confirm event
- **WHEN** the user clicks the Confirm button
- **THEN** the `confirm` event SHALL be emitted and `open` SHALL be updated to `false`

#### Scenario: Cancel button emits cancel event
- **WHEN** the user clicks the Cancel button or the backdrop
- **THEN** the `cancel` event SHALL be emitted and `open` SHALL be updated to `false`

#### Scenario: Confirm button uses destructive styling for delete flows
- **WHEN** `confirmVariant="destructive"` prop is set
- **THEN** the Confirm button SHALL render with destructive variant styling
