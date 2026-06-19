import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../app/types/database.types'
import { mapNews } from '~/utils/mappers/news'
import { mapCategory } from '~/utils/mappers/category'
import type { NewsDto } from '~/types/news'

type AppSupabaseClient = SupabaseClient<Database>

const NEWS_WITH_CATEGORY = '*, categories(*)' as const

export interface RecommendationCandidate {
  article: NewsDto
  similarity: number
}

/**
 * Fetch semantically similar articles from the same category using pgvector.
 * Returns candidates with similarity scores — caller is responsible for re-ranking.
 */
export async function findSimilarArticles(
  client: AppSupabaseClient,
  articleId: string,
  categoryId: string | null,
  queryEmbedding: number[],
  limit: number,
): Promise<RecommendationCandidate[]> {
  const candidateLimit = limit * 4

  const { data: rpcData, error: rpcError } = await client.rpc('match_article_embeddings', {
    query_embedding: queryEmbedding as unknown as string,
    match_count: candidateLimit,
    min_similarity: 0.1,
  })

  if (rpcError) {
    throw new Error(`[recommendation.repository] findSimilarArticles RPC failed: ${rpcError.message}`)
  }

  const candidates = (rpcData ?? []) as Array<{ article_id: string; similarity: number }>
  const filteredIds = candidates
    .filter(c => c.article_id !== articleId)
    .map(c => c.article_id)

  if (filteredIds.length === 0) return []

  let query = client
    .from('news')
    .select(NEWS_WITH_CATEGORY)
    .in('id', filteredIds)
    .eq('status', 'published')

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data: articles, error: artError } = await query

  if (artError) {
    throw new Error(`[recommendation.repository] findSimilarArticles articles fetch failed: ${artError.message}`)
  }

  const simMap = new Map(candidates.map(c => [c.article_id, c.similarity]))

  return (articles ?? []).map((row) => {
    const category = row.categories ? mapCategory(row.categories as Parameters<typeof mapCategory>[0]) : null
    return {
      article: mapNews(row, category),
      similarity: simMap.get(row.id) ?? 0,
    }
  })
}

/**
 * Fetch semantically related articles across all categories using pgvector.
 * Returns candidates with similarity scores — caller is responsible for re-ranking.
 */
export async function findRelatedArticles(
  client: AppSupabaseClient,
  articleId: string,
  queryEmbedding: number[],
  limit: number,
): Promise<RecommendationCandidate[]> {
  const candidateLimit = limit * 4

  const { data: rpcData, error: rpcError } = await client.rpc('match_article_embeddings', {
    query_embedding: queryEmbedding as unknown as string,
    match_count: candidateLimit,
    min_similarity: 0.1,
  })

  if (rpcError) {
    throw new Error(`[recommendation.repository] findRelatedArticles RPC failed: ${rpcError.message}`)
  }

  const candidates = (rpcData ?? []) as Array<{ article_id: string; similarity: number }>
  const filteredIds = candidates
    .filter(c => c.article_id !== articleId)
    .map(c => c.article_id)

  if (filteredIds.length === 0) return []

  const { data: articles, error: artError } = await client
    .from('news')
    .select(NEWS_WITH_CATEGORY)
    .in('id', filteredIds)
    .eq('status', 'published')

  if (artError) {
    throw new Error(`[recommendation.repository] findRelatedArticles articles fetch failed: ${artError.message}`)
  }

  const simMap = new Map(candidates.map(c => [c.article_id, c.similarity]))

  return (articles ?? []).map((row) => {
    const category = row.categories ? mapCategory(row.categories as Parameters<typeof mapCategory>[0]) : null
    return {
      article: mapNews(row, category),
      similarity: simMap.get(row.id) ?? 0,
    }
  })
}

/**
 * Fetch full article data for the given IDs (published only).
 */
export async function findArticlesByIds(
  client: AppSupabaseClient,
  ids: string[],
): Promise<NewsDto[]> {
  if (ids.length === 0) return []

  const { data, error } = await client
    .from('news')
    .select(NEWS_WITH_CATEGORY)
    .in('id', ids)
    .eq('status', 'published')

  if (error) {
    throw new Error(`[recommendation.repository] findArticlesByIds failed: ${error.message}`)
  }

  return (data ?? []).map((row) => {
    const category = row.categories ? mapCategory(row.categories as Parameters<typeof mapCategory>[0]) : null
    return mapNews(row, category)
  })
}

/**
 * Fallback: return most-viewed published articles, optionally filtered by category,
 * optionally excluding a specific article ID.
 */
export async function findMostViewedFallback(
  client: AppSupabaseClient,
  excludeId?: string,
  categoryId?: string,
  limit: number = 6,
): Promise<NewsDto[]> {
  const fetchLimit = limit + (excludeId ? 1 : 0)

  let query = client
    .from('news')
    .select(NEWS_WITH_CATEGORY)
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(fetchLimit)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`[recommendation.repository] findMostViewedFallback failed: ${error.message}`)
  }

  const items = (data ?? []).map((row) => {
    const category = row.categories ? mapCategory(row.categories as Parameters<typeof mapCategory>[0]) : null
    return mapNews(row, category)
  })

  return excludeId
    ? items.filter(a => a.id !== excludeId).slice(0, limit)
    : items.slice(0, limit)
}

/**
 * Record that an anonymous session viewed an article.
 */
export async function insertViewHistory(
  client: AppSupabaseClient,
  sessionId: string,
  articleId: string,
): Promise<void> {
  const { error } = await client
    .from('user_article_history')
    .insert({ anonymous_session_id: sessionId, article_id: articleId })

  if (error) {
    throw new Error(`[recommendation.repository] insertViewHistory failed: ${error.message}`)
  }
}

/**
 * Fetch the embedding vectors for the most recent N articles viewed by a session.
 * Requires service_role client (article_embeddings table is service_role only).
 */
export async function getRecentViewedEmbeddings(
  client: AppSupabaseClient,
  sessionId: string,
  limit: number = 10,
): Promise<Array<{ article_id: string; embedding: number[] }>> {
  const { data: historyData, error: histError } = await client
    .from('user_article_history')
    .select('article_id')
    .eq('anonymous_session_id', sessionId)
    .order('viewed_at', { ascending: false })
    .limit(limit)

  if (histError) {
    throw new Error(`[recommendation.repository] getRecentViewedEmbeddings history query failed: ${histError.message}`)
  }

  const articleIds = (historyData ?? []).map(r => r.article_id)
  if (articleIds.length === 0) return []

  const { data: embedData, error: embedError } = await client
    .from('article_embeddings')
    .select('article_id, embedding')
    .in('article_id', articleIds)

  if (embedError) {
    throw new Error(`[recommendation.repository] getRecentViewedEmbeddings embeddings query failed: ${embedError.message}`)
  }

  return (embedData ?? []).map(row => ({
    article_id: row.article_id,
    // embedding is stored as pgvector string '[1.0,2.0,...]' — parse to number[]
    embedding: JSON.parse(row.embedding) as number[],
  }))
}
