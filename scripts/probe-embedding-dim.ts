/**
 * Probe the embedding dimension from LM Studio.
 *
 * Usage:
 *   npx tsx scripts/probe-embedding-dim.ts
 *
 * Make sure LM Studio is running with an embedding model loaded before running
 * this script. The printed dimension value must be used in the
 * `*_article_embeddings.sql` migration file.
 */

import 'dotenv/config'

const baseUrl = process.env.LMSTUDIO_BASE_URL ?? 'http://localhost:1234'
const model = process.env.LMSTUDIO_EMBEDDING_MODEL ?? 'embeddinggemma-300m-qat-GGUF'

async function main() {
  console.warn(`Probing embedding dimension from: ${baseUrl}`)
  console.warn(`Model: ${model}`)
  console.warn('')

  const response = await fetch(`${baseUrl}/v1/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      input: 'probe',
    }),
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to connect to LM Studio at ${baseUrl}: ${message}`)
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '(no body)')
    throw new Error(`LM Studio returned HTTP ${response.status}: ${text}`)
  }

  const json = await response.json() as { data?: Array<{ embedding?: number[] }> }
  const embedding = json?.data?.[0]?.embedding

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error('Unexpected response shape — could not find embedding array in response')
  }

  console.warn(`✓ Embedding dimension: ${embedding.length}`)
  console.warn('')
  console.warn('Next step: set this value in supabase/migrations/*_article_embeddings.sql')
  console.warn(`  embedding vector(${embedding.length})`)
}

main().catch((err: unknown) => {
  console.error('Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
