## 1. Metadata Foundations

- [x] 1.1 Add any missing `nuxt-svgo` metadata icon assets under `app/assets/icons/` and keep existing `eye.svg` as the view-count icon
- [x] 1.2 Add or update a shared view-count formatting helper for compact card-friendly display

## 2. News Card UI/UX

- [x] 2.1 Update `app/components/news/NewsCard.vue` to render a clearer metadata row with published date and formatted view count
- [x] 2.2 Refine card spacing, hierarchy, and hover treatment so metadata remains secondary to the article title and summary
- [x] 2.3 Verify news listing cards still render correctly across home, category, and news hub surfaces

## 3. News Detail Metadata

- [x] 3.1 Update `app/pages/news/[slug].vue` to display article view count in the detail-page header
- [x] 3.2 Keep the existing client-mount view recording flow unchanged while ensuring the page remains stable if the view request fails

## 4. Verification

- [x] 4.1 Verify the current `POST /api/news/:id/view` semantics remain mount-based and no new API or database changes are introduced
- [x] 4.2 Run `npm run typecheck`
- [x] 4.3 Run `npm run lint`
