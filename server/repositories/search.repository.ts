import type { SupabaseClient } from '@supabase/supabase-js'

export interface SearchResult {
  article_id: string
  similarity: number
}

/**
 * Search articles by embedding similarity using pgvector.
 * @param client Supabase client
 * @param queryEmbedding Embedding vector of the search query
 * @param minSimilarity Minimum cosine similarity threshold (0-1). Only articles above this score are returned.
 * @returns Array of article IDs with similarity scores, ordered by similarity descending
 */
export async function searchByEmbedding(
  client: SupabaseClient,
  queryEmbedding: number[],
  minSimilarity: number = 0.35,
): Promise<SearchResult[]> {
  const { data, error } = await client.rpc('match_article_embeddings', {
    query_embedding: queryEmbedding,
    min_similarity: minSimilarity,
    // match_count omitted — SQL DEFAULT NULL means no hard limit
  })

  if (error) {
    throw new Error(`Search RPC failed: ${error.message}`)
  }

  return data || []
}
