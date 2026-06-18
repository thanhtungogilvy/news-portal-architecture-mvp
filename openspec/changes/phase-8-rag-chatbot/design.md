## Context

Users cannot ask questions about the news portal's content. Phase 8.4 adds a RAG chatbot that uses published articles as its knowledge base: retrieves the most relevant articles via pgvector, builds a context prompt, calls the LM Studio chat model, and returns a structured response including the answer, article cards, and 3 follow-up questions.

**Current state:** No `/api/chat`, no chat page, no chat UI components. `lmstudio.provider.ts` (`chat()` function) and `match_article_embeddings` RPC are provided by Phase 8.1. Search repository is reused from Phase 8.2.

**Constraints:**
- Chatbot MUST answer only from retrieved article context — no hallucinated facts
- MUST respond in same language as user question (VI or EN)
- MUST always return exactly 3 follow-up questions
- Frontend MUST NOT call LM Studio directly
- Return 503 when LM Studio is unavailable

## Goals / Non-Goals

**Goals:**
- `POST /api/chat` — RAG pipeline: embed question → retrieve top-5 articles → build context → LM Studio chat → return answer + article cards + 3 follow-up questions
- Chat page at `/chat`
- `ChatPanel`, `ChatMessage`, `ChatArticleCard`, `FollowUpQuestions` components
- Chat entry point in public navigation

**Non-Goals:**
- Conversation memory across sessions (each request is stateless)
- Streaming responses (standard completion only for POC)
- Chat history persistence in DB
- Admin chat moderation UI

## Decisions

### Decision 1 — Stateless per-request RAG (no conversation memory)

**Choice:** Each `POST /api/chat` is independent. The client sends only the current message. No conversation history is sent to the server.

**Rationale:** Simplest implementation. LM Studio context window on a small model (4B params) is limited. Multi-turn memory can be added in a future phase. For a news Q&A use-case, single-turn is sufficient for demo.

**Alternative rejected:** Full conversation history in each request — rejected because it quickly exceeds context window of the local model.

### Decision 2 — Top-5 article retrieval for RAG context

**Choice:** Embed user query, call `match_article_embeddings` with `match_count=5`, use all 5 articles as context.

**Rationale:** 5 articles provides sufficient context for a small local model without overflowing its context window. `content` field is truncated to 800 chars per article to keep total context manageable.

### Decision 3 — Structured system prompt enforces language + grounding + format

**Choice:**
```
System: You are a news assistant for [portal name].
Answer ONLY using the provided article context.
Respond in the same language as the user's question.
If the context is insufficient, say you don't have enough information.
Always end your response with exactly 3 follow-up questions as a JSON array
on the last line: {"followUpQuestions": ["...", "...", "..."]}
```

**Rationale:** Inline JSON in the response is the most reliable way to extract structured data from a local model without function calling support. The system prompt is the single source of truth for chatbot behavior rules.

**Alternative rejected:** Function calling / tool use — rejected because small local models have unreliable function calling support.

### Decision 4 — Parse follow-up questions from last JSON line

**Choice:** Server parses the last line of the model response looking for `{"followUpQuestions": [...]}`. If parsing fails, server returns 3 generic fallback questions rather than failing the request.

**Rationale:** Resilient to model not following instructions perfectly. Never fails the user with a 500 due to parse error.

### Decision 5 — Article cards selected from retrieved context (not generated)

**Choice:** The article cards returned in the response are the same top-5 retrieved articles (or subset if fewer are relevant). Not hallucinated by the model.

**Rationale:** Prevents hallucinated article titles/slugs. Cards are deterministic and correct.

## Risks / Trade-offs

**[Risk] Model ignores system prompt and hallucinates**
→ Mitigation: System prompt clearly instructs grounding. For POC demo environment this is acceptable. Log `AI_DEBUG=true` responses for monitoring.

**[Risk] Model produces malformed JSON for follow-up questions**
→ Mitigation: Fallback to 3 generic questions ("Bạn muốn tìm hiểu thêm gì?", etc.). Request never fails.

**[Risk] LM Studio response latency (3–10s for chat completion)**
→ Mitigation: Show typing indicator in chat UI. Acceptable for local POC.

**[Trade-off] No conversation memory**
→ Each question is independent. Users cannot build on previous answers. Document as known limitation. Acceptable for demo.

## Migration Plan

1. Phase 8.1 must be complete (lmstudio.provider `chat()` function, article embeddings)
2. Phase 8.2 search repository must be complete (reused for RAG retrieval)
3. Deploy `POST /api/chat`
4. Deploy chat page and components
5. Add chat entry to navigation

## Open Questions

- None.
