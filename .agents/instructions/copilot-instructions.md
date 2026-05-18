# Repository Instructions

This is a Nuxt 4, Vue 3, TypeScript project using npm, Tailwind CSS, Pinia, Supabase, Zod, Day.js, VueUse, and `nuxt-svgo`.

Follow these conventions:

- Use the Nuxt 4 app structure under `app/`.
- Keep Nitro server code under root-level `server/`.
- Keep TypeScript strict and run `npm run typecheck` for type-sensitive changes.
- Component auto-import uses filename-only registration because `pathPrefix: false`; avoid duplicate component filenames.
- Nested composables auto-import through `imports.dirs: ["composables/**"]`.
- Use Tailwind theme tokens from `tailwind.config.ts` before introducing new colors.
- Use Pinia for shared client state.
- Use the Nuxt Supabase integration for Supabase features; client-side Supabase should be auth-only, with business data going through `server/api`.
- Put Supabase schema/RLS changes in `supabase/migrations` or `supabase/seeds`.
- Keep reusable agent assets in `.agents`; `.codex` and `.github` paths are compatibility symlinks.
- For OpenSpec work, use the assets under `.agents/skills/openspec-*` and `.agents/prompts/opsx-*.prompt.md`.
