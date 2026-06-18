import { serverSupabaseServiceRole } from '#supabase/server'
import { selectArticleIdsToEnqueue } from '../../../services/embedding-backfill.service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const client = await serverSupabaseServiceRole(event)

  // Find all published articles that do NOT already have a completed or
  // processing embedding job — insert a pending job for each one.
  const { data: articles, error: articlesError } = await client
    .from('news')
    .select('id')
    .eq('status', 'published')

  if (articlesError) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch published articles')
  }

  if (!articles || articles.length === 0) {
    setResponseStatus(event, 202)
    return successResponse({ enqueued: 0 })
  }

  const articleIds = articles.map(a => a.id)

  // Find article IDs that already have a completed or processing job
  const { data: existingJobs, error: jobsError } = await client
    .from('embedding_jobs')
    .select('article_id')
    .in('article_id', articleIds)
    .in('status', ['completed', 'processing'])

  if (jobsError) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch existing embedding jobs')
  }

  const toEnqueue = selectArticleIdsToEnqueue(articleIds, existingJobs ?? [])

  if (toEnqueue.length === 0) {
    setResponseStatus(event, 202)
    return successResponse({ enqueued: 0 })
  }

  const { error: insertError } = await client
    .from('embedding_jobs')
    .insert(toEnqueue.map(article_id => ({ article_id })))

  if (insertError) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to enqueue embedding jobs')
  }

  setResponseStatus(event, 202)
  return successResponse({ enqueued: toEnqueue.length })
})
