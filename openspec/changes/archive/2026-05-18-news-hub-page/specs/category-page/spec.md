## MODIFIED Requirements

### Requirement: CategoryPill links to news hub with query param
CategoryPill SHALL link to `/news?category=<slug>` instead of `/categories/<slug>`. Active state SHALL be computed from `route.query.category` when on path `/news`.

#### Scenario: CategoryPill link target
- **WHEN** user clicks a CategoryPill
- **THEN** browser navigates to `/news?category=<slug>`

#### Scenario: CategoryPill active on news hub
- **WHEN** user is on `/news?category=the-thao`
- **THEN** the "Thể thao" pill renders with active styles

#### Scenario: CategoryPill inactive on other routes
- **WHEN** user is on `/categories/the-thao` (direct URL)
- **THEN** no pill is active (CategoryNav may not be visible on that page)
