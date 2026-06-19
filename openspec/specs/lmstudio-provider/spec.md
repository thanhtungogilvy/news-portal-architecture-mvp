# LM Studio Provider

OpenAI-compatible AI provider adapter for local LM Studio, used for embeddings and chat completions.

**Implemented in:** Phase 8.1 (`phase-8-embedding-foundation`)
**Last updated:** 2026-06-19

---

## Requirements

### Requirement: LM Studio provider calls embeddings endpoint
`lmstudio.provider.ts` SHALL expose an `embed(text: string): Promise<number[]>` function that calls `LMSTUDIO_BASE_URL/v1/embeddings` with the configured `LMSTUDIO_EMBEDDING_MODEL` and returns the float array.

#### Scenario: Successful embedding call
- **WHEN** LM Studio is running and `embed("test input")` is called
- **THEN** it SHALL return a `number[]` of length equal to the model's embedding dimension

#### Scenario: LM Studio unreachable
- **WHEN** `LMSTUDIO_BASE_URL` host is not reachable
- **THEN** `embed()` SHALL throw an error with a message indicating LM Studio is unavailable

---

### Requirement: LM Studio provider calls chat completion endpoint
`lmstudio.provider.ts` SHALL expose a `chat(messages: ChatMessage[]): Promise<string>` function that calls `LMSTUDIO_BASE_URL/v1/chat/completions` with the configured `LMSTUDIO_CHAT_MODEL`.

#### Scenario: Successful chat call
- **WHEN** LM Studio is running with chat model loaded and `chat([...])` is called
- **THEN** it SHALL return the assistant message content string

#### Scenario: LM Studio unreachable for chat
- **WHEN** `LMSTUDIO_BASE_URL` host is not reachable
- **THEN** `chat()` SHALL throw an error with a message indicating LM Studio is unavailable

---

### Requirement: Provider reads configuration from environment variables
The provider SHALL read `LMSTUDIO_BASE_URL`, `LMSTUDIO_EMBEDDING_MODEL`, and `LMSTUDIO_CHAT_MODEL` from environment. If any required variable is missing, it SHALL throw a configuration error at call time.

#### Scenario: Missing base URL
- **WHEN** `LMSTUDIO_BASE_URL` is not set and `embed()` or `chat()` is called
- **THEN** the function SHALL throw with a clear message identifying the missing variable

---

### Requirement: Frontend never calls LM Studio directly
LM Studio calls SHALL only originate from `server/` code. No client-side code, composable, or page SHALL import or call `lmstudio.provider.ts` or any LM Studio endpoint.

#### Scenario: AI feature call flow
- **WHEN** a user triggers semantic search, recommendation, or chatbot from the browser
- **THEN** the browser SHALL call a Nuxt `server/api` endpoint which calls `lmstudio.provider.ts` — never the browser calling LM Studio directly
