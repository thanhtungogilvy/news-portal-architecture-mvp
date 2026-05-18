## Why

News cards and the news detail header currently stop at category, date, title, and summary. The portal already tracks `view_count`, but that signal is not surfaced in the reading UI, and the news surfaces do not yet have a consistent SVG-icon treatment for metadata rows.

## What Changes

- Improve `NewsCard` visual hierarchy so article metadata is easier to scan in home, category, and news hub listings.
- Display formatted view count in news listing cards using project SVG icons imported through `nuxt-svgo`.
- Display current view count in the news detail header so the detail page matches the listing metadata language.
- Standardize icon usage for news metadata surfaces and document the required SVG assets in the implementation.
- Keep the existing view-count backend flow: the count is still incremented by the detail-page client mount flow, not by raw card click alone.

## Capabilities

### New Capabilities
- `news-card-metadata`: News listing cards expose a consistent metadata row including published date, formatted view count, and SVG iconography.

### Modified Capabilities
- `news-detail-page`: The detail-page header now displays article view count and keeps the existing best-effort client-side view increment behavior.

## Impact

- `app/components/news/NewsCard.vue` — metadata layout and icon-enhanced view count
- `app/pages/news/[slug].vue` — detail header metadata update with visible views
- `app/assets/icons/` — use existing `eye.svg` and add any missing metadata icons as SVG files compatible with `nuxt-svgo`
- No database schema changes
- No API contract changes
- No change to current `POST /api/news/:id/view` counting semantics
