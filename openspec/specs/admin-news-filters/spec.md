### Requirement: Admin news list supports category and status filtering
The admin news list page SHALL provide controls to filter articles by category and by status. Filters SHALL update the displayed list without a full page reload. Both filters SHALL be independently optional; when unset the full list is shown.

#### Scenario: Filter by category
- **WHEN** admin selects a category from the category filter
- **THEN** the news table SHALL show only articles belonging to that category

#### Scenario: Filter by status
- **WHEN** admin selects a status from the status filter (Draft, Published, Archived)
- **THEN** the news table SHALL show only articles with that status

#### Scenario: Clear filter
- **WHEN** admin selects the default "All" option in either filter
- **THEN** the filter for that dimension SHALL be cleared and all articles shown again

#### Scenario: Filters are independent
- **WHEN** both category and status filters are active simultaneously
- **THEN** the list SHALL show only articles matching BOTH filter values

#### Scenario: Filter bar while categories are loading
- **WHEN** the category list has not yet loaded
- **THEN** the category filter control SHALL be disabled until categories are available
