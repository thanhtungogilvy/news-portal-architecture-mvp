## ADDED Requirements

### Requirement: Article content HTML is sanitized before public render
The public article detail page SHALL sanitize `article.content` through DOMPurify before passing it to `v-html`. Only a whitelist of safe semantic HTML tags SHALL be rendered.

#### Scenario: Safe HTML rendered correctly
- **WHEN** `article.content` contains formatting tags (strong, em, h2, h3, ul, ol, li, blockquote, code, pre, a, img, hr, br, p)
- **THEN** those elements SHALL render as expected in the article body

#### Scenario: Script tags stripped
- **WHEN** `article.content` contains `<script>` tags
- **THEN** those tags and their content SHALL be removed before render

#### Scenario: Inline event handlers stripped
- **WHEN** `article.content` contains attributes like `onclick`, `onerror`, `onload`
- **THEN** those attributes SHALL be removed before render

#### Scenario: data: URL images stripped
- **WHEN** `article.content` contains `<img src="data:...">` URIs
- **THEN** those src values SHALL be removed before render

#### Scenario: Plain text content unaffected
- **WHEN** `article.content` is plain text with no HTML tags
- **THEN** it SHALL render as text without modification
