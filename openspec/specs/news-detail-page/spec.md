## ADDED Requirements

### Requirement: News detail page displays full article content
The news detail page (`/news/:slug`) SHALL fetch and render the full article via GET /api/news/:slug including title, thumbnail, content, category, author, and published date.

#### Scenario: Valid published article
- **WHEN** `/news/my-article-slug` is visited for a published article
- **THEN** the full article content SHALL be rendered including title, thumbnail, body, category badge, and published date

#### Scenario: Loading state
- **WHEN** article data is pending
- **THEN** skeleton placeholders SHALL be rendered for title and content areas

#### Scenario: Not found or draft
- **WHEN** `/news/nonexistent-slug` is visited
- **THEN** the page SHALL display a "Not Found" error state

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

### Requirement: News detail page displays related articles from the same category
The news detail page SHALL fetch and render up to 3 published articles from the same category as the current article, excluding the current article itself.

#### Scenario: Related articles available
- **WHEN** the current article belongs to a category that has other published articles
- **THEN** the page SHALL render up to 3 related articles as cards, each linking to the respective article detail page

#### Scenario: Current article excluded
- **WHEN** the same-category fetch returns the current article in its result
- **THEN** the current article SHALL be excluded from the rendered related articles list

#### Scenario: No related articles
- **WHEN** the current article has no category, or no other published articles exist in its category
- **THEN** the related articles section SHALL be omitted or empty without error
