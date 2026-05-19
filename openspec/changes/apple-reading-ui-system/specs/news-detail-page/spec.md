## MODIFIED Requirements

### Requirement: News detail page displays full article content
The news detail page (`/news/:slug`) SHALL render the full published article from GET `/api/news/:slug` in an Apple-inspired long-form reading layout with restrained metadata, strong title hierarchy, and calm hero/media treatment.

#### Scenario: Valid published article
- **WHEN** `/news/my-article-slug` is visited for a published article
- **THEN** the page SHALL render the title, thumbnail or hero media, category context, body content, and published metadata in a long-form reading layout optimized for readability

#### Scenario: Loading state
- **WHEN** article data is pending
- **THEN** the page SHALL render skeleton placeholders matching the intended article layout

#### Scenario: Not found or draft
- **WHEN** `/news/nonexistent-slug` is visited
- **THEN** the page SHALL display a user-facing not-found state

### Requirement: News detail page triggers view count on client mount
The news detail page SHALL fire POST `/api/news/:id/view` once after client mount and SHALL continue rendering normally if the request fails.

#### Scenario: View count fired on mount
- **WHEN** the article page mounts in the browser
- **THEN** POST `/api/news/:id/view` SHALL be called exactly once

#### Scenario: View count not fired during SSR
- **WHEN** the article page is rendered on the server
- **THEN** no view count request SHALL be made

#### Scenario: View count request fails
- **WHEN** POST `/api/news/:id/view` returns an error
- **THEN** the page SHALL continue to display normally with no raw error shown to the user

### Requirement: News detail header displays article view count
The article detail header SHALL display view count together with the current article metadata using the shared public reading presentation language.

#### Scenario: Detail page with article views
- **WHEN** a published article detail page is rendered
- **THEN** the header SHALL display the article title, published date, category context when available, and current view count
