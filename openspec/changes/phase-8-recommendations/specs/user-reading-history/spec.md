## ADDED Requirements

### Requirement: Anonymous session ID is persisted in cookie
`useAnonymousSession` composable SHALL generate a UUID v4 on first visit and persist it in a cookie (`session_id`, SameSite=Lax, 365-day expiry). Subsequent visits SHALL reuse the same ID.

#### Scenario: First visit — no cookie
- **WHEN** a user visits the site for the first time with no `session_id` cookie
- **THEN** `useAnonymousSession` SHALL generate a UUID and set the cookie

#### Scenario: Return visit — cookie present
- **WHEN** a user returns with an existing `session_id` cookie
- **THEN** `useAnonymousSession` SHALL return the existing ID without generating a new one

---

### Requirement: Article views are recorded per anonymous session
`POST /api/news/:id/history` SHALL insert a row into `user_article_history` with the session ID and article ID.

#### Scenario: View recorded
- **WHEN** client calls `POST /api/news/:id/history` with `{ sessionId: "<uuid>" }`
- **THEN** server SHALL insert `(anonymous_session_id, article_id, viewed_at)` into `user_article_history`

#### Scenario: Called from news detail page
- **WHEN** user navigates to a news detail page
- **THEN** the page SHALL call `POST /api/news/:id/history` with the anonymous session ID

---

### Requirement: Personalized recommendations use session reading history
`GET /api/recommendations/for-you?sessionId=<id>` SHALL load the last 10 viewed article embeddings for the session, compute the average profile vector, and return up to 6 semantically similar unread articles.

#### Scenario: Sufficient history (≥2 articles)
- **WHEN** session has viewed at least 2 articles
- **THEN** server SHALL return HTTP 200 with up to 6 personalized article recommendations excluding already-viewed articles

#### Scenario: Insufficient history (<2 articles)
- **WHEN** session has viewed fewer than 2 articles
- **THEN** server SHALL fallback and return most-viewed articles

#### Scenario: LM Studio unavailable — fallback
- **WHEN** LM Studio is not reachable
- **THEN** server SHALL return HTTP 200 with most-viewed articles (not 503)

---

### Requirement: Personalized section on home page
`app/pages/index.vue` SHALL render a `PersonalizedArticles` section using the for-you endpoint.

#### Scenario: Section renders with personalized results
- **WHEN** home page loads and session has sufficient history
- **THEN** "Articles You May Like" section SHALL be visible with article cards

#### Scenario: Section shows popular articles on first visit
- **WHEN** home page loads and session has no history
- **THEN** section SHALL show most-viewed articles as fallback (not empty)
