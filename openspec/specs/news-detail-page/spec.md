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
The news detail page SHALL fire POST /api/news/:id/view once after the component mounts on the client side (not during SSR). Failure SHALL be silently ignored.

#### Scenario: View count fired on mount
- **WHEN** the news detail page finishes mounting in the browser
- **THEN** POST /api/news/:id/view SHALL be called exactly once

#### Scenario: View count not fired during SSR
- **WHEN** the news detail page is rendered on the server
- **THEN** no view count request SHALL be made

#### Scenario: View count request fails
- **WHEN** POST /api/news/:id/view returns an error
- **THEN** the page SHALL continue to display normally with no error shown to the user

### Requirement: News detail header displays article view count
The news detail page SHALL display the article view count in the article header together with the existing article metadata.

#### Scenario: Detail page with article views
- **WHEN** a published article detail page is rendered
- **THEN** the header SHALL display the article title, published date, and current article view count

#### Scenario: View count request is best-effort
- **WHEN** the detail page records a view on client mount
- **THEN** the page SHALL continue to display normally even if the view-recording request fails
