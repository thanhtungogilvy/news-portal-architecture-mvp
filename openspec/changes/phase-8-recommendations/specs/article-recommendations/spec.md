## ADDED Requirements

### Requirement: Similar articles endpoint returns same-category recommendations
`GET /api/news/:id/similar` SHALL return up to 6 published articles from the same category as the requested article, ranked by re-ranking formula, excluding the current article.

#### Scenario: Article has category and embeddings exist
- **WHEN** client calls `GET /api/news/:id/similar` for an article with a category
- **THEN** server SHALL return HTTP 200 with up to 6 articles from the same category ordered by re-ranking score

#### Scenario: Article has no embeddings yet
- **WHEN** article embedding is not yet generated
- **THEN** server SHALL return HTTP 200 with an empty `data` array

#### Scenario: LM Studio unavailable — fallback
- **WHEN** LM Studio is not reachable
- **THEN** server SHALL return HTTP 200 with most-viewed articles from the same category (not 503)

---

### Requirement: Related articles endpoint returns cross-category recommendations
`GET /api/news/:id/related` SHALL return up to 6 published articles from any category, ranked by re-ranking formula, excluding the current article.

#### Scenario: Related articles found
- **WHEN** client calls `GET /api/news/:id/related`
- **THEN** server SHALL return HTTP 200 with up to 6 articles across all categories ordered by re-ranking score

#### Scenario: LM Studio unavailable — fallback
- **WHEN** LM Studio is not reachable
- **THEN** server SHALL return HTTP 200 with most-viewed articles (not 503)

---

### Requirement: Re-ranking formula applied to recommendation candidates
The recommendation service SHALL re-rank vector search candidates using: `final_score = semantic_similarity * 0.7 + recency_boost * 0.2 + view_count_boost * 0.1` where recency and view_count boosts are min-max normalized across the candidate set.

#### Scenario: Re-ranking sorts results
- **WHEN** recommendation candidates are retrieved
- **THEN** results SHALL be sorted by `final_score` descending

---

### Requirement: Recommendation UI sections on news detail page
`app/pages/news/[slug].vue` SHALL render `SimilarArticles` and `RelatedArticles` sections below the article content.

#### Scenario: Sections render with results
- **WHEN** news detail page loads and both recommendation endpoints return results
- **THEN** both sections SHALL be visible with article cards

#### Scenario: Section hidden when empty
- **WHEN** a recommendation endpoint returns empty array
- **THEN** that section SHALL not render (no empty section with heading but no cards)
