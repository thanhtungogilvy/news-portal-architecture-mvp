import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { embed } from './ai/lmstudio.provider'
import { searchByEmbedding } from '../repositories/search.repository'
import { mapNews } from '~/utils/mappers/news'
import { mapCategory } from '~/utils/mappers/category'
import type { NewsDto } from '~/types/news'
import type { SearchResult } from '~/types/search'

/**
 * Search tuning parameters - adjust these to improve relevance
 *
 * Tuning guide:
 * - MIN_SIMILARITY: Filter articles below this cosine similarity threshold (0-1 scale)
 *   - Increase (0.35→0.50) to show only very relevant results (stricter)
 *   - Decrease (0.35→0.25) to include more loosely related results (permissive)
 *   - Filtering happens at the pgvector/SQL level — all articles are searched, no hard limit
 *
 * - MAX_RESULTS: Cap on how many results to return to the client
 */
const SEARCH_CONFIG = {
  MIN_SIMILARITY: 0.40,
  MAX_RESULTS: 10,
} as const

/**
 * Perform semantic search on articles using query embedding + pgvector similarity.
 *
 * @param event H3Event for accessing Supabase client
 * @param query Search query text
 * @param categorySlug Optional category slug to filter results
 * @returns Top 10 semantically ranked articles with similarity score
 * @throws Error if LM Studio is unavailable or embedding fails
 */
export async function semanticSearch(
  event: H3Event,
  query: string,
  categorySlug?: string,
): Promise<SearchResult[]> {
  // 1. Embed the query via LM Studio
  let queryEmbedding: number[]
  try {
    queryEmbedding = await embed(query)
  } catch (err) {
    // Re-throw with a message that the API handler can catch
    throw new Error(`LM_STUDIO_UNAVAILABLE: ${err instanceof Error ? err.message : String(err)}`)
  }

  const client = await serverSupabaseClient(event)

  // 2. Search ALL articles in pgvector above the similarity threshold
  // No hard limit — SQL filters by min_similarity, pgvector handles the ranking
  const searchResults = await searchByEmbedding(
    client,
    queryEmbedding,
    SEARCH_CONFIG.MIN_SIMILARITY,
  )

  if (searchResults.length === 0) {
    return []
  }

  // 3. Fetch full article data for all matched article IDs
  const articleIds = searchResults.map(r => r.article_id)
  const { data: articles, error } = await client
    .from('news')
    .select('*, categories(*)')
    .in('id', articleIds)
    .eq('status', 'published')

  if (error) {
    throw new Error(`Failed to fetch article data: ${error.message}`)
  }

  // 4. Build a map of article_id -> article for O(1) lookup
  const articleMap = new Map<string, { article: NewsDto, score: number }>()

  for (const row of articles ?? []) {
    const category = row.categories ? mapCategory(row.categories as Parameters<typeof mapCategory>[0]) : null
    const article = mapNews(row, category)
    const searchResult = searchResults.find(r => r.article_id === article.id)
    if (searchResult) {
      articleMap.set(article.id, { article, score: searchResult.similarity })
    }
  }

  // 5. Reconstruct results in original order from pgvector, preserving scores
  let results = searchResults
    .map(({ article_id, similarity }) => {
      const entry = articleMap.get(article_id)
      if (!entry) return null

      const { article } = entry
      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        thumbnailUrl: article.thumbnailUrl,
        category: article.category?.slug ?? null,
        score: similarity,
        rawScore: similarity,
      } as SearchResult
    })
    .filter((item): item is SearchResult => item !== null)

  // 6. Filter by category if provided (post-filter)
  if (categorySlug) {
    results = results.filter(item => item.category === categorySlug)
  }

  // 7. Return top N results (similarity already filtered at SQL level)
  const topResults = results.slice(0, SEARCH_CONFIG.MAX_RESULTS)

  // Normalize scores relative to the top result so the best match = 100%
  // This gives users a meaningful percentage regardless of the absolute score range
  if (topResults.length > 0) {
    const maxScore = topResults[0]!.score
    return topResults.map(r => ({
      ...r,
      rawScore: r.rawScore,
      score: maxScore > 0 ? r.score / maxScore : r.score,
    }))
  }

  return topResults
}
