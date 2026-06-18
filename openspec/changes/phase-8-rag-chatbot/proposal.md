## Why

Users cannot ask questions about the news portal's content in natural language. A RAG chatbot — grounded exclusively in published articles — lets users query the knowledge base conversationally, discover articles through dialogue, and get suggested follow-up questions. This is the capstone GenAI feature of Phase 8.

## What Changes

- Add `rag-context.service.ts` — retrieves top-K relevant articles via pgvector, builds structured prompt context from article content
- Add `rag-chat.service.ts` — calls LM Studio chat completion (`google/gemma-4-e2b`) with RAG context, extracts answer + article references + 3 follow-up questions from response
- Add `POST /api/chat` — accepts `{ message: string }`, returns `{ answer, articles, followUpQuestions }`
- Chatbot system prompt rules: answer only from provided context; respond in same language as user question; always return exactly 3 follow-up questions
- Return HTTP 503 with clear message when LM Studio is unavailable
- Add `app/pages/chat.vue` — full chatbot page with message history
- Add `ChatPanel.vue`, `ChatMessage.vue`, `ChatArticleCard.vue`, `FollowUpQuestions.vue` components
- Add `useRagChat.ts` composable — manages message history, loading state, streaming (if LM Studio supports it)
- Add chatbot entry point in public navigation (floating button or nav link)

## Capabilities

### New Capabilities
- `rag-chatbot`: Conversational Q&A grounded in published articles using RAG (retrieve → augment → generate), returns answer + article cards + 3 follow-up questions per turn

### Modified Capabilities
- `home-page`: Add chatbot entry point (floating action button or header link)
- `layout`: Add chat route to public navigation

## Impact

**New files:**
- `server/api/chat.post.ts`
- `server/services/rag-chat.service.ts`
- `server/services/rag-context.service.ts`
- `app/pages/chat.vue`
- `app/components/chat/ChatPanel.vue`
- `app/components/chat/ChatMessage.vue`
- `app/components/chat/ChatArticleCard.vue`
- `app/components/chat/FollowUpQuestions.vue`
- `app/composables/chat/useRagChat.ts`

**Modified files:**
- `app/components/layout/LayoutHeader.vue` or `app/layouts/default.vue` — add chat entry point

**API contract:**
```
POST /api/chat
Body: { message: string }

Response 200:
{
  answer: string
  articles: Array<{
    title: string
    slug: string
    thumbnailUrl: string | null
    summary: string | null
  }>
  followUpQuestions: [string, string, string]
}

Response 503: { error: "AI_UNAVAILABLE", message: "..." }
```

**Chatbot constraints:**
- Must answer only from retrieved article context — no hallucinated facts
- Must respond in same language as user question (Vietnamese or English)
- Must always return exactly 3 follow-up questions
- Retrieved context: top 5 most semantically similar published articles

**Prerequisites:** Phase 8.1 (article-embeddings, lmstudio-provider) must be complete. Phase 8.2 (semantic-search) search repository is reused for retrieval.
