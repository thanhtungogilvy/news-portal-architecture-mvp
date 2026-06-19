import { serverSupabaseServiceRole } from '#supabase/server'

/**
 * Debug endpoint: shows embedding model distribution in article_embeddings table.
 * Use to verify that the embedding worker switched to a new model correctly.
 *
 * GET /api/internal/debug/embeddings
 */
export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)

  // Count by model
  const { data: byModel, error: modelError } = await client
    .from('article_embeddings')
    .select('embedding_model')

  if (modelError) {
    throw createApiError(500, 'INTERNAL_ERROR', modelError.message)
  }

  const modelCounts: Record<string, number> = {}
  for (const row of byModel ?? []) {
    const m = row.embedding_model ?? 'unknown'
    modelCounts[m] = (modelCounts[m] ?? 0) + 1
  }

  // Total articles vs total embeddings
  const { count: totalArticles } = await client
    .from('news')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')

  const totalEmbeddings = byModel?.length ?? 0

  // Latest embedding timestamp
  const { data: latest } = await client
    .from('article_embeddings')
    .select('updated_at, embedding_model')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  return successResponse({
    totalPublishedArticles: totalArticles ?? 0,
    totalEmbeddings,
    coverage: totalArticles ? `${Math.round((totalEmbeddings / totalArticles) * 100)}%` : '0%',
    modelDistribution: modelCounts,
    latestEmbedding: latest ?? null,
  })
})
