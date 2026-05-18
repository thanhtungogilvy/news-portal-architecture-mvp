## ADDED Requirements

### Requirement: News detail header displays article view count
The news detail page SHALL display the article view count in the article header together with the existing article metadata.

#### Scenario: Detail page with article views
- **WHEN** a published article detail page is rendered
- **THEN** the header SHALL display the article title, published date, and current article view count

#### Scenario: View count request is best-effort
- **WHEN** the detail page records a view on client mount
- **THEN** the page SHALL continue to display normally even if the view-recording request fails
