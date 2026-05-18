## ADDED Requirements

### Requirement: Admin can create multiple categories in one submission
The category creation page SHALL present a dynamic list of rows, each containing a name and auto-generated slug. The admin SHALL be able to add rows, remove rows, and edit slugs manually. Submitting SHALL create all rows in a single operation.

#### Scenario: Default state — one empty row
- **WHEN** admin navigates to Create Categories
- **THEN** the form SHALL show one empty row with Name and Slug fields

#### Scenario: Auto-generate slug from name
- **WHEN** admin types in the Name field of a row
- **THEN** the Slug field of that row SHALL auto-populate with a URL-safe version of the name (lowercase, hyphens)

#### Scenario: Manually override slug
- **WHEN** admin edits the Slug field directly
- **THEN** the slug SHALL no longer be auto-updated when the name changes for that row

#### Scenario: Add a row
- **WHEN** admin clicks "Add row"
- **THEN** a new empty Name + Slug row SHALL be appended

#### Scenario: Remove a row
- **WHEN** admin clicks the remove button on a row
- **AND** more than one row exists
- **THEN** that row SHALL be removed from the list

#### Scenario: Cannot remove last row
- **WHEN** only one row remains
- **THEN** the remove button SHALL be disabled or hidden

#### Scenario: Successful batch create
- **WHEN** all rows have valid names and slugs and admin clicks Create
- **THEN** all categories SHALL be created
- **AND** admin SHALL be redirected to the categories list

#### Scenario: Slug conflict on one row
- **WHEN** submission fails because one or more slugs already exist
- **THEN** the conflicting row(s) SHALL be highlighted with an inline error
- **AND** the non-conflicting rows SHALL NOT be created (atomic: all-or-nothing)
