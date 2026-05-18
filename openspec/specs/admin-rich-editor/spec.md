### Requirement: Admin can author article body with rich text formatting
The system SHALL provide a rich text editor (TipTap) for the article body field. The editor SHALL support the Standard extension set: Bold, Italic, Heading H2/H3, BulletList, OrderedList, Blockquote, Code, Link, HardBreak, HorizontalRule. The editor output SHALL be an HTML string stored in `news.content`.

#### Scenario: Apply bold formatting
- **WHEN** editor selects text and clicks Bold in the toolbar
- **THEN** the selected text SHALL be wrapped in `<strong>`

#### Scenario: Insert heading
- **WHEN** editor clicks H2 or H3 in the toolbar
- **THEN** the current block SHALL become a heading at the selected level

#### Scenario: Insert ordered and unordered lists
- **WHEN** editor clicks BulletList or OrderedList in the toolbar
- **THEN** the current block SHALL become a list item in the appropriate list type

#### Scenario: Insert link
- **WHEN** editor selects text and clicks the Link button
- **THEN** a prompt SHALL appear asking for a URL
- **AND** the selected text SHALL become an anchor pointing to the entered URL

#### Scenario: Content output is HTML
- **WHEN** the form submits
- **THEN** `modelValue.content` SHALL contain the TipTap HTML output string

### Requirement: Admin can insert images into article body by URL
The editor SHALL provide an explicit Insert Image action. Inline images in the body are separate from `thumbnail_url` and MUST be inserted intentionally.

#### Scenario: Insert image via URL
- **WHEN** editor clicks the Insert Image toolbar button
- **THEN** an inline dialog SHALL appear with fields: Image URL (required), Alt text (required), Title (optional)
- **WHEN** editor confirms
- **THEN** an `<img>` node SHALL be inserted at the cursor position with the provided attributes

#### Scenario: Insert image via library picker
- **WHEN** editor opens the Insert Image dialog
- **THEN** a "Choose from library" toggle SHALL be available showing the `news-thumbnails` storage grid
- **AND** clicking any image SHALL populate the Image URL field without inserting automatically

#### Scenario: Use thumbnail URL convenience
- **WHEN** the article has a `thumbnail_url` set
- **AND** editor opens the Insert Image dialog
- **THEN** a "Use thumbnail URL" shortcut SHALL pre-fill the Image URL field on click

#### Scenario: thumbnail_url not auto-inserted into body
- **WHEN** the thumbnail field is set or changed
- **THEN** the editor body content SHALL NOT be modified
