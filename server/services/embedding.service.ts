import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../app/types/database.types'
import { embed } from './ai/lmstudio.provider'
import { upsertEmbedding } from '../repositories/article-embedding.repository'

type AppSupabaseClient = SupabaseClient<Database>

/** Article fields used to build embedding text. */
interface ArticleEmbeddingFields {
  id: string
  title: string
  summary: string | null
  content: string
  categoryName: string | null
}

/**
 * Build a structured plain-text string from article fields for embedding.
 * Omits fields that are null/empty to avoid noise in the vector space.
 * Content is HTML-stripped and capped at 500 characters.
 */
export function buildEmbeddingText(article: ArticleEmbeddingFields): string {
  const lines: string[] = []

  lines.push(`Title: ${article.title}`)

  if (article.summary?.trim()) {
    lines.push(`Summary: ${article.summary.trim()}`)
  }

  const description = stripHtml(article.content).slice(0, 2000).trim()
  if (description) {
    lines.push(`Description: ${description}`)
  }

  if (article.categoryName?.trim()) {
    lines.push(`Category: ${article.categoryName.trim()}`)
  }

  return lines.join('\n')
}

/**
 * Strip HTML tags from a string.
 * Uses a simple regex — sufficient for embedding text truncation purposes.
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Generate an embedding for the given article and upsert it into
 * `article_embeddings`. Fetches article data from the database before calling
 * LM Studio so this can be called with just the article ID.
 */
export async function generateAndSaveEmbedding(
  client: AppSupabaseClient,
  articleId: string,
): Promise<void> {
  // Fetch article with category name
  const { data: article, error } = await client
    .from('news')
    .select('id, title, summary, content, categories(name)')
    .eq('id', articleId)
    .maybeSingle()

  if (error) {
    throw new Error(`[embedding.service] Failed to fetch article ${articleId}: ${error.message}`)
  }

  if (!article) {
    throw new Error(`[embedding.service] Article ${articleId} not found`)
  }

  const categoryName
    = Array.isArray(article.categories)
      ? ((article.categories[0] as { name?: string })?.name ?? null)
      : ((article.categories as { name?: string } | null)?.name ?? null)

  const embeddingText = buildEmbeddingText({
    id: article.id,
    title: article.title,
    summary: article.summary,
    content: article.content,
    categoryName,
  })

  const model = process.env.LMSTUDIO_EMBEDDING_MODEL ?? ''
  const vector = await embed(embeddingText)

  await upsertEmbedding(client, {
    article_id: article.id,
    embedding: vector,
    embedding_text: embeddingText,
    embedding_model: model,
  })
}
