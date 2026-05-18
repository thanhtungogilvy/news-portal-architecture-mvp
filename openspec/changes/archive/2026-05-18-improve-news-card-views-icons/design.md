## Context

The public news UI already has the data needed to surface article popularity: `NewsDto` includes `viewCount`, the list endpoints return it, and the detail page already triggers `POST /api/news/:id/view` on client mount. The gap is presentation, not backend capability.

`NewsCard` is reused across the home page, category page, and news hub page, so any metadata refinement is cross-cutting across multiple public surfaces. The repo also uses `nuxt-svgo` for icon assets, and currently only `eye.svg` / `eye-off.svg` exist in `app/assets/icons/`.

## Goals / Non-Goals

**Goals:**
- Surface article view count in listing cards without changing the current API or database contract
- Improve news card scanability by organizing metadata into a clearer row
- Show current view count in the news detail header so the detail page matches listing metadata
- Use `nuxt-svgo`-compatible SVG assets for metadata icons and make any new icon additions explicit

**Non-Goals:**
- Changing view-count semantics to unique-per-user, per-session, or debounced counting
- Adding analytics, bot filtering, or anti-refresh protections
- Changing the `POST /api/news/:id/view` backend contract
- Redesigning unrelated layout primitives or category navigation

## Decisions

### D1: Keep existing view-count semantics
The current behavior increments `view_count` when the detail page mounts on the client and the article payload is available. This is not a unique-view system, but it matches the current product behavior and avoids widening scope into analytics logic.
- **Alternative**: Increment on raw card click. Rejected because route failures and prefetch/navigation edge cases would make the signal less tied to a successful article read.
- **Alternative**: Add session/IP dedupe now. Rejected because it adds backend state and product semantics that were not requested for this change.

### D2: Put listing metadata refinement in `NewsCard`
`NewsCard` is the single shared component used by the listing surfaces, so view-count display and metadata hierarchy should live there rather than being repeated per page.
- **Alternative**: Customize each page separately. Rejected because it duplicates markup and risks inconsistent metadata treatment.

### D3: Use a balanced metadata row
The card metadata row should present:
- category badge
- published date
- formatted view count

The date and views should read as secondary metadata rather than competing with the title. A compact row with subdued color and small icon markers keeps the card denser without making it noisy.
- **Alternative**: Show view count as a separate footer line. Rejected because it increases card height variance and weakens scanability.

### D4: Reuse existing `IconEye` and add one missing date icon
This change should reuse `app/assets/icons/eye.svg` as `<IconEye />` for views. To keep the metadata row visually consistent, add one date icon asset, such as `calendar.svg`, in `app/assets/icons/`, following the repo’s `nuxt-svgo` conventions.
- **Alternative**: Use raw inline SVG. Rejected because the repo standard is `nuxt-svgo` auto-import.
- **Alternative**: Show date without icon. Acceptable fallback, but weaker visually than a balanced icon+text row.

### D5: Format view counts for card density, keep detail count more literal
Listing cards should use compact formatting (`1.2K`, `98.4K`) so numbers stay short in grids. The detail page can use either the same formatter or a less compact human-readable number, but it should remain visually secondary to the title and date.
- **Alternative**: Render raw integers everywhere. Rejected because long numbers create visual noise in cards.

## Risks / Trade-offs

- [Refreshes and repeated visits still increase views] → Keep current semantics explicit in docs/specs and defer unique-view logic to a later analytics hardening change.
- [Adding icon assets without documenting them leads to inconsistent future icon usage] → Make the new asset addition explicit in tasks and keep usage on `nuxt-svgo` components only.
- [Compact number formatting may hide exact counts] → Use compact formatting in dense card layouts and allow the detail page to show a fuller number if needed.
- [Metadata row can become visually busy] → Keep icon size and text treatment subdued, and avoid introducing more than date + views as secondary signals.
