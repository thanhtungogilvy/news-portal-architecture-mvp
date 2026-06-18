import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../../app/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>
export type ArticleEmbeddingRow = Tables<'article_embeddings'>

export interface UpsertEmbeddingInput {
  article_id: string
  embedding: number[]
  embedding_text: string
  embedding_model: string
}

/**
 * Upsert an embedding row for the given article.
 * Updates the existing row if one already exists (based on article_id unique index).
 */
export async function upsertEmbedding(
  client: AppSupabaseClient,
  input: UpsertEmbeddingInput,
): Promise<void> {
  const { error } = await client
    .from('article_embeddings')
    .upsert(
      {
        article_id: input.article_id,
        // pgvector expects the vector as a string in the form '[1.0, 2.0, ...]'
        embedding: `[${input.embedding.join(',')}]` as unknown as string,
        embedding_text: input.embedding_text,
        embedding_model: input.embedding_model,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'article_id' },
    )

  if (error) {
    throw new Error(`[article-embedding.repository] upsertEmbedding failed: ${error.message}`)
  }
}

/**
 * Retrieve the embedding row for a given article, or null if not found.
 */
export async function findEmbeddingByArticleId(
  client: AppSupabaseClient,
  articleId: string,
): Promise<ArticleEmbeddingRow | null> {
  const { data, error } = await client
    .from('article_embeddings')
    .select('*')
    .eq('article_id', articleId)
    .maybeSingle()

  if (error) {
    throw new Error(`[article-embedding.repository] findEmbeddingByArticleId failed: ${error.message}`)
  }

  return data
}
