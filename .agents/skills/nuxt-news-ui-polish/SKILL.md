---
name: nuxt-news-ui-polish
description: Improve and polish frontend UI/UX for a Nuxt 4 news portal or editorial website. Use when asked to beautify, redesign, review, refine, or implement public news pages, admin dashboards, article layouts, news cards, category pages, TipTap article content styling, loading states, empty states, error states, responsive layouts, or production-grade interface quality while preserving existing Nuxt/Vue/Tailwind architecture and API flow.
---

# Nuxt News UI Polish

Use this skill to turn working Nuxt news-portal screens into polished, production-grade editorial interfaces. Prioritize readability, hierarchy, consistency, and real product usability over decorative novelty.

Preserve existing behavior and architecture. Improve one page or feature at a time unless the user explicitly asks for a broad redesign.

## Core Principle

Make the UI feel like a real news website or editorial CMS, not a scaffold, generic SaaS dashboard, or AI-generated landing page.

## Project Constraints

Follow these constraints whenever the target project matches this stack:

- Framework: Nuxt 4, Vue 3, TypeScript, ESM.
- Styling: Tailwind CSS via `@nuxtjs/tailwindcss`.
- State: Pinia only for genuinely shared client state such as auth.
- Backend/data: business data flows through Nuxt `server/api`.
- Client Supabase usage is limited to auth/session concerns.
- Do not add direct Supabase business-data calls in pages or components.
- Prefer Nuxt auto-imports where the project supports them.
- Keep TypeScript strict; do not weaken types to make UI code pass.
- Component filenames must be globally unique if `component.pathPrefix` is false.
- Use Tailwind theme tokens before adding one-off colors.
- Run or request `npm run lint` and `npm run typecheck` after implementation when code changes are made.

## Design Direction

Choose a clear editorial direction before changing code. Use the product context to pick one dominant tone, then execute consistently.

Recommended directions for news portals:

- editorial magazine: strong headlines, generous whitespace, confident image treatment.
- refined minimal: restrained palette, excellent type scale, precise spacing.
- high-density newsroom: compact cards, fast scanning, strong metadata hierarchy.
- premium analysis: calm surfaces, long-form reading comfort, elegant dividers.

Avoid:

- generic purple gradients or common AI/SaaS visual tropes.
- excessive animation that hurts reading.
- overly experimental article layouts that reduce comprehension.
- dashboard-like public pages.
- unstructured dense lists.
- inconsistent card heights and metadata treatment.

## Workflow

1. Inspect the current page/component structure and identify the active data flow.
2. Preserve data fetching through composables and Nuxt `server/api`.
3. Define the page's primary user goal and visual hierarchy.
4. Improve layout, typography, spacing, states, and responsive behavior.
5. Extract reusable components only when reuse is clear.
6. Check loading, empty, error, and success states.
7. Verify accessibility basics: semantic headings, labels, focus states, readable contrast.
8. Run lint/typecheck when possible.
9. Summarize what changed and what remains.

## Public News UI Quality Bar

Public pages must optimize for fast scanning and comfortable reading.

Prioritize:

- strong headline hierarchy.
- readable article typography.
- clean category navigation.
- scannable news cards.
- clear metadata: category, date, views, author if available.
- balanced image treatment.
- responsive desktop, tablet, and mobile layouts.
- useful loading, empty, and error states.
- subtle motion that supports clarity.

### Home Page Checklist

Improve these areas:

- top story / hero hierarchy.
- featured article layout.
- latest news grid or list.
- category navigation and active states.
- trending or most-viewed section if available.
- visual balance between image, headline, excerpt, and metadata.
- skeleton loading that avoids layout shift.
- meaningful empty state if no articles are available.
- SEO-friendly heading structure.

### Category Page Checklist

Improve these areas:

- category header with name and optional description.
- active category navigation.
- article grid/list readability.
- pagination or infinite-scroll feedback.
- empty category state with a useful next action.
- responsive stacking and spacing.

### Article Detail Page Checklist

Improve these areas:

- article title hierarchy.
- metadata presentation.
- hero/thumbnail treatment.
- long-form reading width.
- TipTap-rendered content styling.
- inline image styling.
- blockquote, list, link, code, and heading styles.
- previous/next or related article navigation if present.
- dynamic SEO/meta readiness.

### TipTap Content Styling

When styling rendered article content:

- Use a readable max-width for body copy.
- Provide clear spacing between headings, paragraphs, lists, blockquotes, code, and images.
- Style inline images with responsive width, rounded corners if appropriate, captions if available, and stable layout.
- Make links visible and accessible.
- Keep content images separate from `thumbnail_url` behavior.
- Do not auto-insert the thumbnail into article content.

## Admin UI Quality Bar

Admin screens must feel like a polished editorial dashboard, not raw CRUD.

Prioritize:

- reusable admin shell/layout.
- clear page headers with title, description, and primary action.
- readable tables with stable action placement.
- status badges for draft, published, featured, inactive.
- grouped form sections.
- inline validation feedback.
- delete confirmation dialogs.
- success/error feedback after mutations.
- loading, empty, and error states.

Suggested admin component names:

- `AdminShell.vue`
- `AdminSidebar.vue`
- `AdminTopbar.vue`
- `AdminPageHeader.vue`
- `AdminToolbar.vue`
- `AdminDataTable.vue`
- `AdminEmptyState.vue`
- `AdminConfirmDialog.vue`
- `AdminStatusBadge.vue`
- `AdminFormSection.vue`
- `AdminFormActions.vue`
- `AdminNewsForm.vue`
- `AdminCategoryForm.vue`

Ensure filenames are unique across the project.

## Interaction and State Requirements

Every list page should include:

- loading state.
- empty state.
- error state.
- stable layout while fetching.
- clear retry or next action where useful.

Every form page should include:

- validation messages close to fields.
- disabled submit while saving.
- success feedback after save.
- server error feedback that is user-friendly.
- cancel/back action.
- confirmation for destructive actions.

Never show raw database or API errors directly to users.

## Implementation Rules

When writing or editing code:

- Keep changes scoped to the requested page/feature.
- Preserve working composables and API contracts.
- Do not replace functional data flows with mock data unless explicitly asked.
- Prefer reusable presentational components when patterns repeat.
- Use Tailwind classes consistently and favor theme tokens.
- Avoid adding heavy libraries for simple UI polish.
- Maintain semantic HTML and accessible interactive states.
- Do not hide errors silently.

## Output Format

When responding after a UI improvement task, include:

1. What changed.
2. Files touched.
3. UX improvements added.
4. Validation performed, including lint/typecheck/build if run.
5. Any remaining follow-up items.
