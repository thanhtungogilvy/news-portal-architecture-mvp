/**
 * LM Studio AI provider — OpenAI-compatible HTTP client.
 *
 * Used by all Phase 8 AI features (embedding, recommendations, RAG chatbot).
 * Only imported from server/ code — never from client-side composables or pages.
 *
 * Configuration is read from environment variables at call time so the module
 * can be imported without throwing at startup.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface EmbeddingResponse {
  data: Array<{ embedding: number[] }>
}

interface ChatCompletionResponse {
  choices: Array<{ message: { content: string } }>
}

function getBaseUrl(): string {
  const url = process.env.LMSTUDIO_BASE_URL
  if (!url) {
    throw new Error(
      '[lmstudio] LMSTUDIO_BASE_URL is not set. '
      + 'Set it to the LM Studio server address (e.g. http://localhost:1234).',
    )
  }
  return url.replace(/\/$/, '')
}

function getEmbeddingModel(): string {
  const model = process.env.LMSTUDIO_EMBEDDING_MODEL
  if (!model) {
    throw new Error(
      '[lmstudio] LMSTUDIO_EMBEDDING_MODEL is not set. '
      + 'Set it to the identifier of the embedding model loaded in LM Studio.',
    )
  }
  return model
}

function getChatModel(): string {
  const model = process.env.LMSTUDIO_CHAT_MODEL
  if (!model) {
    throw new Error(
      '[lmstudio] LMSTUDIO_CHAT_MODEL is not set. '
      + 'Set it to the identifier of the chat model loaded in LM Studio.',
    )
  }
  return model
}

function isDebug(): boolean {
  return process.env.AI_DEBUG === 'true'
}

async function fetchLmStudio<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`[lmstudio] LM Studio is unreachable at ${url}: ${message}`)
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '(no body)')
    throw new Error(`[lmstudio] HTTP ${response.status} from LM Studio: ${text}`)
  }

  return response.json() as Promise<T>
}

/**
 * Generate an embedding vector for the given text.
 * @returns Float array with length equal to the probed embedding dimension.
 */
export async function embed(text: string): Promise<number[]> {
  const baseUrl = getBaseUrl()
  const model = getEmbeddingModel()
  const url = `${baseUrl}/v1/embeddings`

  if (isDebug()) {
    console.warn(`[lmstudio:embed] model=${model} textLength=${text.length}`)
  }

  const data = await fetchLmStudio<EmbeddingResponse>(url, { model, input: text })

  const embedding = data?.data?.[0]?.embedding
  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('[lmstudio] Unexpected embedding response shape — no vector returned')
  }

  return embedding
}

/**
 * Send a chat completion request and return the assistant reply content.
 */
export async function chat(messages: ChatMessage[]): Promise<string> {
  const baseUrl = getBaseUrl()
  const model = getChatModel()
  const url = `${baseUrl}/v1/chat/completions`

  if (isDebug()) {
    console.warn(`[lmstudio:chat] model=${model} messages=${messages.length}`)
  }

  const data = await fetchLmStudio<ChatCompletionResponse>(url, { model, messages })

  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    throw new Error('[lmstudio] Unexpected chat completion response shape — no content returned')
  }

  return content
}
