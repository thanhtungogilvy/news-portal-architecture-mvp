## Why

The current public reading UI is functional, but it does not yet express a cohesive high-end visual system across the home page, listings, and article detail surfaces. The site needs a shared Apple-inspired reading aesthetic applied at the theme, shell, component, and page levels so the reading experience feels deliberate, premium, and consistent instead of incrementally polished.

## What Changes

- Introduce an Apple-inspired public reading design system driven by shared color, typography, spacing, radius, and surface rules reflected in project config and reusable components.
- Redesign the public shell to use restrained navigation, alternating light/dark section rhythm, and minimal chrome that lets editorial content lead.
- Rework the home page into photography-first product-tile-like story bands with a clear lead article and supporting editorial hierarchy.
- Update news cards, buttons, pills, pagination, and shared UI primitives so public reading interactions follow the new design language consistently.
- Apply the same reading-system rules to `/news`, category pages, and article detail pages so browsing and long-form reading feel like one unified product.

## Capabilities

### New Capabilities
- `public-reading-apple-theme`: Defines the shared Apple-inspired public reading design system, including theme tokens, typography scale, surface rhythm, and shared presentation rules used across public pages.
- `public-reading-shell`: Defines the public reading shell, including the global navigation, supporting sub-navigation rhythm, and footer treatment for public reading pages.

### Modified Capabilities
- `home-page`: Change home page requirements to support Apple-inspired hero bands, a photography-first lead story treatment, and restrained supporting editorial layout.
- `news-hub-page`: Change the `/news` listing requirements to support the new light/dark section rhythm, cleaner category framing, and quieter chrome.
- `category-page`: Change category page requirements to align its heading, list treatment, and navigation behavior with the shared public reading system.
- `news-detail-page`: Change article detail requirements to support Apple-inspired long-form reading, stronger title framing, and more restrained metadata and hero treatment.
- `news-card-metadata`: Change reusable news-card requirements so lead, supporting, and compact cards follow the new hierarchy and visual grammar.
- `ui-primitives`: Change shared public-facing button, badge, pagination, and card requirements to align with the new public reading design language.

## Impact

- Affected config and shared styling files such as `tailwind.config.ts` plus public UI components under `app/components/layout`, `app/components/news`, `app/components/category`, and `app/components/ui`.
- Affected public pages under `app/pages/index.vue`, `app/pages/news/index.vue`, `app/pages/categories/[slug].vue`, and `app/pages/news/[slug].vue`.
- No new content APIs are required; the redesign stays on existing Nuxt composables and `server/api` flows.
