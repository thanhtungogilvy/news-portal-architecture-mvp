## Context

The requested direction is not a generic UI cleanup. It is a system-level redesign of the public reading experience using an Apple-inspired design language: photography-first tiles, minimal chrome, near-monochrome surfaces, one interactive blue, display typography with tight tracking, and very limited elevation. That affects shared tokens, shell structure, card hierarchy, and article reading surfaces together.

The project already has working public routes and shared public UI components. The correct implementation path is therefore to preserve existing data flow and page architecture while replacing the current editorial styling language with a shared reading theme that can be reused across all public surfaces.

## Goals / Non-Goals

**Goals:**
- Introduce a shared Apple-inspired public reading theme reflected in project config and shared presentational components.
- Create a quieter public shell that emphasizes content and imagery over interface chrome.
- Apply one coherent design system across home, list, category, and article detail pages.
- Make lead-story, supporting-story, and long-form reading experiences feel more premium and consistent.
- Preserve the existing Nuxt route structure, composables, and `server/api` contracts.

**Non-Goals:**
- No admin UI redesign in this change.
- No changes to repositories, service logic, or Supabase business-data access.
- No introduction of decorative gradients or new multi-accent brand systems beyond the provided Apple-inspired context.
- No replacement of article storage, sanitization, or content schema.

## Decisions

### 1. Map the Apple-inspired design context into shared theme/config primitives first

This redesign cannot be maintained if it only lives inside page-level classes. The theme has to be reflected in shared config and reusable primitives so pages inherit the same surface, typography, radius, and CTA rules.

Alternative considered:
- Apply the look through page-local Tailwind classes only.
- Rejected because it would create drift between home, list, and article pages and make future refinement expensive.

### 2. Preserve current public data flow and treat the redesign as a presentation-system migration

The site already has working data sources for featured, most-viewed, lists, categories, and detail pages. The visual system can be replaced without introducing new content endpoints or changing business logic.

Alternative considered:
- Introduce new APIs specifically to support Apple-style hero bands and curated sections.
- Rejected because the design language change is primarily about composition, shell rhythm, and component presentation.

### 3. Use alternating light/dark reading bands selectively rather than forcing every page into one background

The Apple-inspired context depends on section rhythm through surface alternation, not heavy chrome. Home and selected public sections should use that rhythm deliberately, while article detail pages stay optimized for reading comfort on light surfaces.

Alternative considered:
- Apply dark/light alternation mechanically to every page section.
- Rejected because article reading and dense news listings need calm readability first.

### 4. Treat lead-story cards as a separate presentation pattern, not just a scaled-up standard card

The Apple-inspired home page requires a photography-first lead story block with restrained metadata and a stronger image/content relationship. That pattern should be explicitly represented in shared components.

Alternative considered:
- Keep one card structure and only scale typography for the lead item.
- Rejected because it produces generic cards rather than a true top-story surface.

### 5. Keep interaction language minimal: one blue, pill actions, soft hairlines, almost no shadow

The design context is strict about restraint. Interactive emphasis should come from layout, typography, and the single blue action color rather than from gradients, multiple accent colors, or large shadows.

Alternative considered:
- Blend the existing editorial palette with the new Apple-inspired system.
- Rejected because it would dilute the direction and make the site feel indecisive.

## Risks / Trade-offs

- [Theme migration affects many shared components] → Centralize the token shift in config and shared UI primitives first, then reapply page layouts.
- [Apple-inspired system may reduce overt editorial cues too much] → Preserve clear story hierarchy through typography, imagery scale, and section sequencing rather than heavy chrome.
- [Dark/light alternation can hurt reading consistency if overused] → Limit the strongest alternation to hero and showcase surfaces; keep long-form reading calm.
- [Existing public cards may not fit the new system cleanly] → Introduce explicit lead/supporting/compact presentation rules instead of forcing one universal card.
- [Current fonts may not perfectly match SF Pro] → Use the closest available stack while preserving size, spacing, weight, and tracking behavior defined by the design context.
