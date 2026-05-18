## Context

The admin API is fully implemented (Phase 3): `GET/POST/PATCH/DELETE` for `/api/admin/news` and `/api/admin/categories`, auth guard via `requireAuth`, and Zod-validated input. The public site (Phase 1–3) runs on the `default` Nuxt layout with `LayoutHeader` / `LayoutFooter`.

The admin panel needs a separate visual shell, seven new pages, four domain components, two composables, and two new UI primitives. Route-level auth is already enforced by `app/middleware/auth.ts` — it redirects unauthenticated users to `/login` (note: admin login is at `/admin/login` per project structure; middleware redirect target must match).

## Goals / Non-Goals

**Goals:**
- Deliver a polished, production-quality editorial dashboard — not a temporary CRUD scaffold.
- Ship a dedicated `admin.vue` layout with sidebar navigation, user identity, and logout.
- Build list, create, and edit pages for both news and categories using reusable domain components.
- Add `UiInput` and `UiModal` UI primitives required by admin forms and delete confirmation.
- All admin pages must feel visually consistent: same spacing, typography, table patterns, form card patterns, badge/button styles.
- Pass `npm run typecheck` and `npm run lint` after implementation.

**Non-Goals:**
- No new API endpoints — data access is complete.
- No rich-text WYSIWYG editor — body field is a plain `<textarea>`.
- No bulk actions, sorting, or server-side search — out of scope for Phase 4.
- No role-based access beyond the existing session guard.
- No media upload — thumbnail is a plain URL text input.

## Decisions

### 1. Dedicated `admin.vue` Nuxt layout

**Decision**: Create `app/layouts/admin.vue` as the admin shell.

All admin pages (`app/pages/admin/**`) declare `definePageMeta({ layout: 'admin' })`. The layout renders a two-column shell: a fixed left sidebar with navigation links and user/logout section, and a `<slot />` main content area.

**Rationale**: Keeps admin structure DRY and separates it cleanly from the public `default` layout. Changing the nav, sidebar, or header requires editing one file.

**Alternative considered**: A shared `AdminShell.vue` wrapper component rendered manually in each page. Rejected — more boilerplate, and Nuxt layouts are the idiomatic solution.

---

### 2. Domain components own all table and form presentation

**Decision**: `AdminNewsTable`, `AdminNewsForm`, `AdminCategoryTable`, `AdminCategoryForm` are domain components in `app/components/admin/`. Pages only orchestrate composable calls and render these components.

**Rationale**: Follows the project's boundary rule — pages handle route meta / layout composition, components handle UI and local interaction. Form logic (reactive state, submission, validation) lives in the composable, not the component or page.

**Form component interface**: Each form component accepts a `modelValue` prop (the current form data) and emits `update:modelValue` (v-model), `submit`, and `cancel`.

---

### 3. `useAdminNews` and `useAdminCategories` composables own mutation state

**Decision**: Two composables at `app/composables/admin/useAdminNews.ts` and `useAdminCategories.ts` each expose:
- `list` — reactive `useFetch` result for the list endpoint
- `create(input)`, `update(id, input)`, `remove(id)` — async functions wrapping `$fetch` for mutations
- `pending`, `error` — derived state for UI feedback

**Rationale**: Keeps pages thin and makes the data-fetching contract testable and reusable. `useFetch` for lists (SSR-friendly), `$fetch` for mutations (imperative, no caching).

---

### 4. Delete confirmation via `UiModal`, not `window.confirm`

**Decision**: Add `UiModal.vue` to `app/components/ui/`. Delete buttons open a modal that requires an explicit "Delete" confirm click.

**Rationale**: `window.confirm` is blocked in some browsers during test, looks inconsistent with the design, and cannot be styled. A controlled modal is consistent with the visual language and can be tested.

`UiModal` is a generic slot-based dialog: `v-model:open`, slot for content, `@confirm` and `@cancel` events.

---

### 5. UiInput as a unified form field primitive

**Decision**: Add `UiInput.vue` to `app/components/ui/`. It wraps `<input>`, `<select>`, and `<textarea>` under a single API:
- `type` prop: `'text' | 'email' | 'url' | 'textarea' | 'select'`
- Passes through standard HTML attributes via `v-bind="$attrs"`
- Accepts `label`, `error`, and (for select) a `options` slot or `options` prop
- `inheritAttrs: false` to correctly bind attrs to the inner element

**Rationale**: A unified input primitive gives all admin forms the same visual baseline without repeating Tailwind classes across every form field.

---

### 6. Status feedback via reactive `toast`-like inline notification

**Decision**: Use a lightweight composable-based feedback pattern: `useAdminToast` in `app/composables/admin/` exposes a reactive `message` (text + type: `success | error`) and an `clear()` fn. The `admin.vue` layout renders a fixed toast element driven by this composable.

**Rationale**: Avoids adding a heavy third-party notification library. The pattern is simple enough to implement inline, consistent with the existing stack, and works across pages because the layout reads from a shared composable state.

---

### 7. Middleware redirect target correction

**Decision**: Update `app/middleware/auth.ts` to redirect unauthenticated users to `/admin/login` (not `/login`) since the admin login page lives at `app/pages/admin/login.vue`.

**Rationale**: The login page route is `/admin/login` per project structure. Redirecting to `/login` (which doesn't exist) would result in a 404 instead of the login page.

---

### 8. `UiButton` destructive variant

**Decision**: Add a `destructive` variant to `UiButton` (red background, white text, red hover). This aligns with the delete action pattern without one-off Tailwind classes in components.

**Rationale**: Consistent button hierarchy: `primary` (create/save), `secondary` (cancel/back), `destructive` (delete). Already planned in the proposal.

---

### 9. `UiBadge` danger color

**Decision**: Add `danger` color to `UiBadge` for representing inactive/archived states.

**Rationale**: `success` covers `published`, `warning` covers `draft`/`featured`, `danger` is needed for `archived` or inactive states. Consistent with the existing badge color set.

## Risks / Trade-offs

- **Middleware redirect** — If `auth.ts` redirects to `/login` instead of `/admin/login`, admins hitting a protected admin route while unauthenticated get a 404. Must be fixed in this phase. → Mitigation: update the redirect target as part of Task 1.
- **No optimistic updates** — List pages refresh after each mutation via `list.refresh()`. This may feel slightly slower on high-latency connections. → Acceptable for Phase 4; optimistic update is Phase 5 hardening territory.
- **Body as plain textarea** — Long articles are difficult to manage without a rich-text editor. → Acceptable now; Phase 5 can introduce an editor (e.g., Tiptap) as a drop-in replacement for the body field.
- **Toast state is composable-global** — Using a shared composable for toast means only one toast can show at a time. → Acceptable; concurrent mutations are not expected in this UI.

## Migration Plan

1. No database changes required.
2. No server API changes required.
3. Implement in page-by-page order: primitives → layout → categories pages → news pages.
4. Each page must be individually navigable before moving to the next.
5. Run `npm run typecheck && npm run lint` after all pages are complete.
6. No rollback complexity — all changes are additive frontend files.

## Open Questions

- None. All decisions are resolved above.
