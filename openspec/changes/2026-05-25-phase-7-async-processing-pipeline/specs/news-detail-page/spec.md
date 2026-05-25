## MODIFIED Requirements

### Requirement: News detail page triggers view count on client mount
The news detail page SHALL fire POST /api/news/:id/view once after the component mounts on the client side (not during SSR). Failure SHALL be silently ignored, and accepted asynchronous processing SHALL be treated as success.

#### Scenario: View count fired on mount
- **WHEN** the news detail page finishes mounting in the browser
- **THEN** POST /api/news/:id/view SHALL be called exactly once

#### Scenario: Async accepted response
- **WHEN** POST /api/news/:id/view returns HTTP 202
- **THEN** the page SHALL continue to display normally and MAY update local view count optimistically

### Requirement: News detail page exposes adjacent article navigation
The news detail page SHALL render `Newer Post` and `Older Post` navigation when adjacent published articles exist.

#### Scenario: Article has both adjacent posts
- **WHEN** the current published article has both a newer and older neighboring published article
- **THEN** the page SHALL render links for both `Newer Post` and `Older Post`

#### Scenario: First published article
- **WHEN** the current article is the newest published article
- **THEN** the page SHALL omit `Newer Post`

#### Scenario: Last published article
- **WHEN** the current article is the oldest published article
- **THEN** the page SHALL omit `Older Post`
