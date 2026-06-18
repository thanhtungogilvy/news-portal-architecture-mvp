## 1. Server — RAG Services

- [ ] 1.1 Create `server/services/rag-context.service.ts` — `buildRagContext(articles)`: for each article, build context block `Title: ...\nSummary: ...\nContent: <first 800 chars, HTML stripped>\n---`; return concatenated string
- [ ] 1.2 Create `server/services/rag-chat.service.ts` — `ragChat(event, message)`:
  1. Embed `message` via `lmstudio.provider.embed()`
  2. Call `searchByEmbedding` (reuse from Phase 8.2 search repository) with `matchCount=5`
  3. Fetch article details for retrieved IDs
  4. Call `buildRagContext(articles)`
  5. Build system prompt with language + grounding + format instructions
  6. Call `lmstudio.provider.chat([system, user])`
  7. Parse last-line JSON for `followUpQuestions`; fallback to generic 3 if parse fails
  8. Return `{ answer, articles, followUpQuestions }`

## 2. Server — Chat API Endpoint

- [ ] 2.1 Create `server/api/chat.post.ts` — validate `{ message: string }` (non-empty) with Zod, call `ragChat`, return result; catch LM Studio errors and return 503

## 3. Frontend — Composable

- [ ] 3.1 Create `app/composables/chat/useRagChat.ts` — `messages` ref (array of `{ role, content, articles?, followUpQuestions? }`), `pending`, `error`; `send(message)` posts to `/api/chat` and appends assistant response; `clear()` resets history

## 4. Frontend — Chat Components

- [ ] 4.1 Create `app/components/chat/ChatMessage.vue` — renders single message bubble (user or assistant), assistant messages show `answer` text
- [ ] 4.2 Create `app/components/chat/ChatArticleCard.vue` — compact article card with thumbnail, title, summary, link to `/news/:slug`
- [ ] 4.3 Create `app/components/chat/FollowUpQuestions.vue` — renders 3 clickable pill buttons; clicking emits `select(question)` to parent
- [ ] 4.4 Create `app/components/chat/ChatPanel.vue` — full chat interface: message list (scrollable), input bar, send button, loading indicator (typing dots), error state, follow-up questions below last assistant message; clicking follow-up question sends it as next message

## 5. Frontend — Chat Page

- [ ] 5.1 Create `app/pages/chat.vue` — renders `<ChatPanel>`, sets page title/meta, uses default layout

## 6. Frontend — Navigation Entry Point

- [ ] 6.1 Add chat link/icon to `app/components/layout/LayoutHeader.vue` navigating to `/chat`

## 7. Validation

- [ ] 7.1 Run `npm run lint` and fix any issues
- [ ] 7.2 Run `npm run typecheck` and fix any type errors
- [ ] 7.3 Smoke test: ask "AI có ứng dụng gì trong giáo dục?", verify answer + article cards + 3 follow-up questions appear
- [ ] 7.4 Test follow-up questions: click a follow-up, verify it becomes the next user message
- [ ] 7.5 Test bilingual: ask in English, verify response is in English
- [ ] 7.6 Test 503: stop LM Studio, verify chat shows error state (not crash)
- [ ] 7.7 Test grounding: ask about a topic with no articles, verify model says insufficient information
