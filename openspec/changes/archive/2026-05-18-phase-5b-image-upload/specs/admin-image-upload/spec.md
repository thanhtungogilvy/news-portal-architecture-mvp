## ADDED Requirements

### Requirement: Admin can upload a new thumbnail image
The system SHALL allow an admin to upload an image file as the article thumbnail. The upload flow SHALL compress the image client-side before sending to the server. The resulting public URL SHALL be stored as `thumbnail_url` on the article.

#### Scenario: Successful upload via drag-drop
- **WHEN** admin drags an image file onto the upload zone
- **AND** the file is a valid image (MIME type `image/*`) with size ≤ 5 MB
- **THEN** the system SHALL compress the image to WebP at max 1280 px width and max 0.5 MB
- **AND** upload it to the `news-thumbnails` bucket
- **AND** set the thumbnail field to the resulting public URL

#### Scenario: Successful upload via file browser
- **WHEN** admin clicks the upload zone and selects a file
- **THEN** the same compress-and-upload flow SHALL apply as drag-drop

#### Scenario: File too large rejected
- **WHEN** admin drops or selects a file larger than 5 MB
- **THEN** the system SHALL display an inline error and NOT begin upload

#### Scenario: Non-image file rejected
- **WHEN** admin drops or selects a non-image file
- **THEN** the system SHALL display an inline error and NOT begin upload

#### Scenario: Upload in progress — tabs disabled
- **WHEN** compression or upload is in progress
- **THEN** both tabs (Upload / Library) SHALL be disabled until the operation completes or fails

#### Scenario: Upload progress feedback
- **WHEN** compression is running
- **THEN** the UI SHALL show a "Compressing…" indicator
- **WHEN** upload is running
- **THEN** the UI SHALL show an "Uploading…" indicator with the compressed file size

#### Scenario: Remove uploaded thumbnail
- **WHEN** a thumbnail URL is set
- **AND** admin clicks Remove
- **THEN** the thumbnail field SHALL be cleared (URL set to null); the Storage file SHALL remain (no delete on remove)
