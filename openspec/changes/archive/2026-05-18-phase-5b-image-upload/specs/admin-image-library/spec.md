## ADDED Requirements

### Requirement: Admin can select an existing image from the storage library
The system SHALL provide a Library tab that lists files already stored in the `news-thumbnails` bucket. Selecting a file SHALL set the thumbnail URL without uploading again.

#### Scenario: Library loads existing images
- **WHEN** admin switches to the Library tab
- **THEN** the system SHALL fetch and display a grid of existing images from `news-thumbnails`, ordered by upload date descending (newest first)

#### Scenario: Select image from library
- **WHEN** admin clicks an image in the library grid
- **THEN** the thumbnail field SHALL be set to that image's public URL
- **AND** the selected image SHALL be visually indicated (highlight/checkmark)

#### Scenario: Library is empty
- **WHEN** the `news-thumbnails` bucket contains no files
- **THEN** the Library tab SHALL show an empty-state message: "No images uploaded yet."

#### Scenario: Library tab disabled during upload
- **WHEN** an upload is in progress (compressing or uploading)
- **THEN** the Library tab SHALL be disabled and not selectable

#### Scenario: Existing thumbnail shown when editing
- **WHEN** an article already has a `thumbnail_url` set
- **THEN** the component SHALL render in a "selected" state showing a preview of the current URL
- **AND** the editor SHALL be able to click "Change image" to return to the tab picker
