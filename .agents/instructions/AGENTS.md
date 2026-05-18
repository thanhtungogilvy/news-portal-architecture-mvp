# Agent Instructions

## Source of Truth

- Keep shared agent assets in `.agents`.
- `.codex` and `.github` are compatibility adapters that symlink back to `.agents`.
- Add new skills under `.agents/skills/<skill-name>/SKILL.md`.
- Add reusable prompts under `.agents/prompts/*.prompt.md`.
- Add shared instructions under `.agents/instructions`.

## Tech Stack

- Runtime and framework: Nuxt 4, Vue 3, TypeScript, ESM.
- Package manager: npm with `package-lock.json`.
- Styling: Tailwind CSS via `@nuxtjs/tailwindcss`; theme tokens live in `tailwind.config.ts`.
- State: Pinia via `@pinia/nuxt`.
- Backend/data: Supabase via `@nuxtjs/supabase` and `@supabase/supabase-js`.
- Validation and utilities: Zod, Day.js, clsx, VueUse, VueUse Motion.
- Icons: `nuxt-svgo` with source icons in `app/assets/icons`.
- Quality gates: ESLint, Nuxt typecheck, Husky, lint-staged.

## Commands

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Generate static output: `npm run generate`
- Preview build: `npm run preview`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`

## Project Conventions

- Use Nuxt 4 app structure under `app/`.
- Keep Nitro server code under root-level `server/`.
- Keep TypeScript strict and avoid weakening types.
- Prefer Nuxt auto-imports for composables and components where the project already supports them.
- Remember this repo sets component `pathPrefix: false`; component filenames must be unique.
- Nested composables auto-import because `nuxt.config.ts` sets `imports.dirs: ["composables/**"]`.
- Keep Supabase work behind the Nuxt Supabase integration unless a lower-level `@supabase/supabase-js` client is clearly needed.
- Client-side Supabase is for Auth only; business data goes through `server/api`.
- Supabase schema/RLS changes need SQL artifacts under `supabase/migrations` or `supabase/seeds`.
- Use Tailwind theme tokens before adding one-off colors.

## OpenSpec

- OpenSpec files live under `openspec/`.
- Use `.agents/skills/openspec-*` for OpenSpec workflows.
- Use `.agents/prompts/opsx-*.prompt.md` for slash-command style prompts exposed through `.github/prompts`.
- Keep proposals, specs, designs, and task lists consistent with `openspec/config.yaml`.
