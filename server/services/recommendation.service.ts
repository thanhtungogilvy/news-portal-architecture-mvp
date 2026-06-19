import type { H3Event } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'
import { findEmbeddingByArticleId } from '../repositories/article-embedding.repository'
import {
  findSimilarArticles,
  findRelatedArticles,
  findArticlesByIds,
  findMostViewedFallback,
  insertViewHistory,
  getRecentViewedEmbeddings,
  type RecommendationCandidate,
} from '../repositories/recommendation.repository'
import type { NewsDto } from '~/types/news'
import dayjs from 'dayjs'

const RECOMMENDATION_LIMIT = 6

// ─── Re-ranking ──────────────────────────────────────────────────────────────

/**
 * Re-rank recommendation candidates using the formula:
 *   final_score = semantic_similarity * 0.7 + recency_boost * 0.2 + view_count_boost * 0.1
 *
 * recency_boost and view_count_boost are min-max normalized across the candidate set.
 * Returns candidates sorted by final_score descending.
 */
export function rerank(candidates: RecommendationCandidate[]): RecommendationCandidate[] {
  if (candidates.length === 0) return []

  const now = dayjs()

  // Compute raw recency and view count values
  const rawValues = candidates.map((c) => {
    const daysAgo = c.article.publishedAt
      ? now.diff(dayjs(c.article.publishedAt), 'day')
      : 9999
    return {
      candidate: c,
      daysAgo,
      viewCount: c.article.viewCount,
    }
  })

  // Min-max normalization helpers
  const minMax = (values: number[]) => {
    const min = Math.min(...values)
    const max = Math.max(...values)
    return { min, max, range: max - min }
  }

  const daysAgoValues = rawValues.map(v => v.daysAgo)
  const viewCountValues = rawValues.map(v => v.viewCount)
  const daysAgoStats = minMax(daysAgoValues)
  const viewCountStats = minMax(viewCountValues)

  const normalize = (value: number, min: number, range: number): number => {
    if (range === 0) return 0.5
    return (value - min) / range
  }

  const scored = rawValues.map(({ candidate, daysAgo, viewCount }) => {
    // Recency: lower daysAgo = more recent = higher boost (invert normalization)
    const recencyBoost = 1 - normalize(daysAgo, daysAgoStats.min, daysAgoStats.range)
    const viewCountBoost = normalize(viewCount, viewCountStats.min, viewCountStats.range)

    const finalScore
      = candidate.similarity * 0.7
      + recencyBoost * 0.2
      + viewCountBoost * 0.1

    return { candidate, finalScore }
  })

  return scored
    .sort((a, b) => b.finalScore - a.finalScore)
    .map(s => s.candidate)
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Get up to 6 similar articles from the same category, re-ranked by formula.
 * Falls back to most-viewed articles in the same category if LM Studio is unavailable
 * or the article has no embedding yet.
 */
export async function getSimilarArticles(event: H3Event, articleId: string): Promise<NewsDto[]> {
  try {
    const serviceClient = await serverSupabaseServiceRole(event)

    // Load the article's embedding and category
    const embeddingRow = await findEmbeddingByArticleId(serviceClient, articleId)

    if (!embeddingRow) {
      // No embedding yet — return empty (article may not have been processed)
      return []
    }

    // Load the article's category_id from news table
    const { data: newsRow, error: newsError } = await serviceClient
      .from('news')
      .select('category_id')
      .eq('id', articleId)
      .maybeSingle()

    if (newsError || !newsRow) {
      return []
    }

    const categoryId = newsRow.category_id

    // Parse the stored embedding string to number[]
    let queryEmbedding: number[]
    try {
      queryEmbedding = JSON.parse(embeddingRow.embedding) as number[]
    } catch {
      return []
    }

    try {
      const candidates = await findSimilarArticles(
        serviceClient,
        articleId,
        categoryId,
        queryEmbedding,
        RECOMMENDATION_LIMIT,
      )

      return rerank(candidates)
        .slice(0, RECOMMENDATION_LIMIT)
        .map(c => c.article)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[recommendation.service] getSimilarArticles vector search failed, falling back: ${msg}`)

      // Fallback: most-viewed in same category
      return await findMostViewedFallback(
        serviceClient,
        articleId,
        categoryId ?? undefined,
        RECOMMENDATION_LIMIT,
      )
    }
  } catch (err) {
    console.warn('[recommendation.service] getSimilarArticles outer error, returning empty:', err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Get up to 6 related articles across all categories, re-ranked by formula.
 * Falls back to most-viewed articles if LM Studio is unavailable.
 */
export async function getRelatedArticles(event: H3Event, articleId: string): Promise<NewsDto[]> {
  try {
    const serviceClient = await serverSupabaseServiceRole(event)

    const embeddingRow = await findEmbeddingByArticleId(serviceClient, articleId)

    if (!embeddingRow) {
      return []
    }

    let queryEmbedding: number[]
    try {
      queryEmbedding = JSON.parse(embeddingRow.embedding) as number[]
    } catch {
      return []
    }

    try {
      const candidates = await findRelatedArticles(
        serviceClient,
        articleId,
        queryEmbedding,
        RECOMMENDATION_LIMIT,
      )

      return rerank(candidates)
        .slice(0, RECOMMENDATION_LIMIT)
        .map(c => c.article)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[recommendation.service] getRelatedArticles vector search failed, falling back: ${msg}`)

      return await findMostViewedFallback(serviceClient, articleId, undefined, RECOMMENDATION_LIMIT)
    }
  } catch (err) {
    console.warn('[recommendation.service] getRelatedArticles outer error, returning empty:', err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Get up to 6 personalized recommendations for an anonymous session.
 * Builds a profile vector by averaging the last 10 viewed article embeddings,
 * then runs a vector similarity search excluding already-viewed articles.
 *
 * Falls back to most-viewed if:
 * - Session has fewer than 2 viewed articles
 * - LM Studio is unavailable
 */
export async function getPersonalizedRecommendations(
  event: H3Event,
  sessionId: string,
): Promise<NewsDto[]> {
  try {
    const serviceClient = await serverSupabaseServiceRole(event)

    // Load recent viewing history embeddings
    const recentEmbeddings = await getRecentViewedEmbeddings(serviceClient, sessionId, 10)

    if (recentEmbeddings.length < 2) {
      // Insufficient history — return most-viewed fallback
      return await findMostViewedFallback(serviceClient, undefined, undefined, RECOMMENDATION_LIMIT)
    }

    // Compute the user profile vector (component-wise average)
    const dim = recentEmbeddings[0]!.embedding.length
    const profileVector = new Array<number>(dim).fill(0)

    for (const { embedding } of recentEmbeddings) {
      for (let i = 0; i < dim; i++) {
        profileVector[i]! += embedding[i]! / recentEmbeddings.length
      }
    }

    // Get the set of already-viewed article IDs to exclude from results
    const viewedIds = new Set(recentEmbeddings.map(e => e.article_id))

    try {
      const { data: rpcData, error: rpcError } = await serviceClient.rpc('match_article_embeddings', {
        query_embedding: profileVector as unknown as string,
        match_count: RECOMMENDATION_LIMIT * 4,
        min_similarity: 0.1,
      })

      if (rpcError) {
        throw new Error(`RPC failed: ${rpcError.message}`)
      }

      const candidates = (rpcData ?? []) as Array<{ article_id: string; similarity: number }>
      const filteredIds = candidates
        .filter(c => !viewedIds.has(c.article_id))
        .map(c => c.article_id)

      if (filteredIds.length === 0) {
        return await findMostViewedFallback(serviceClient, undefined, undefined, RECOMMENDATION_LIMIT)
      }

      const simMap = new Map(candidates.map(c => [c.article_id, c.similarity]))

      const newsDtos = await findArticlesByIds(serviceClient, filteredIds)

      const recoCandidates: RecommendationCandidate[] = newsDtos.map(article => ({
        article,
        similarity: simMap.get(article.id) ?? 0,
      }))

      return rerank(recoCandidates)
        .slice(0, RECOMMENDATION_LIMIT)
        .map(c => c.article)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[recommendation.service] getPersonalizedRecommendations vector search failed, falling back: ${msg}`)

      return await findMostViewedFallback(serviceClient, undefined, undefined, RECOMMENDATION_LIMIT)
    }
  } catch (err) {
    console.warn('[recommendation.service] getPersonalizedRecommendations outer error, returning empty:', err instanceof Error ? err.message : err)
    return []
  }
}

/**
 * Record that an anonymous session viewed an article.
 * Uses the regular (anon) client since RLS allows anon inserts.
 */
export async function recordArticleView(
  event: H3Event,
  sessionId: string,
  articleId: string,
): Promise<void> {
  const client = await serverSupabaseClient(event)
  await insertViewHistory(client, sessionId, articleId)
}
