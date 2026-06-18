## MODIFIED Requirements

### Requirement: Article create enqueues embedding job
After successfully creating a published article, the system SHALL enqueue an `embedding_jobs` row for that article. This is a fire-and-forget side effect — the API response SHALL NOT wait for embedding generation.

#### Scenario: Article created successfully
- **WHEN** admin creates an article via `POST /api/admin/news`
- **THEN** the article SHALL be saved and a `pending` embedding job SHALL be inserted, and the API SHALL return the created article without waiting for the embedding

#### Scenario: Article created as draft
- **WHEN** admin creates an article with status `draft`
- **THEN** an embedding job SHALL still be enqueued (article may be published later)

---

### Requirement: Article update enqueues embedding job
After successfully updating an article, the system SHALL enqueue a new `embedding_jobs` row for that article to regenerate the embedding with updated content.

#### Scenario: Article updated
- **WHEN** admin updates an article via `PATCH /api/admin/news/:id`
- **THEN** the article SHALL be saved and a new `pending` embedding job SHALL be inserted for re-embedding
