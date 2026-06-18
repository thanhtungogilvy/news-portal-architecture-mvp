import { serverSupabaseServiceRole } from '#supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

type QueueCounts = {
  pending: number
  processing: number
  completed: number
  failed: number
}

type ImportQueueCounts = {
  pending: number
  processing: number
  published: number
  failed: number
}

type WorkerStatusResponse = {
  embedding: {
    publishedArticles: number
    embeddedArticles: number
    coveragePercent: number
    jobs: QueueCounts
    latestFailure: string | null
  }
  viewCount: {
    jobs: QueueCounts
  }
  import: {
    items: ImportQueueCounts
    activeBatches: number
  }
  refreshedAt: string
}

type AppSupabaseClient = SupabaseClient<Database>

async function countRows(
  client: AppSupabaseClient,
  table: 'news' | 'article_embeddings' | 'embedding_jobs' | 'view_count_jobs' | 'import_items' | 'import_batches',
  filter?: { column: string, value: string },
): Promise<number> {
  let query = client.from(table).select('*', { count: 'exact', head: true })
  if (filter) {
    query = query.eq(filter.column, filter.value)
  }

  const { count, error } = await query
  if (error) {
    throw createApiError(500, 'INTERNAL_ERROR', `Failed to fetch ${table} stats`)
  }

  return count ?? 0
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const client = serverSupabaseServiceRole(event)

  const [
    publishedArticles,
    embeddedArticles,
    embeddingPending,
    embeddingProcessing,
    embeddingCompleted,
    embeddingFailed,
    viewPending,
    viewProcessing,
    viewCompleted,
    viewFailed,
    importPending,
    importProcessing,
    importPublished,
    importFailed,
    importActiveBatches,
  ] = await Promise.all([
    countRows(client, 'news', { column: 'status', value: 'published' }),
    countRows(client, 'article_embeddings'),
    countRows(client, 'embedding_jobs', { column: 'status', value: 'pending' }),
    countRows(client, 'embedding_jobs', { column: 'status', value: 'processing' }),
    countRows(client, 'embedding_jobs', { column: 'status', value: 'completed' }),
    countRows(client, 'embedding_jobs', { column: 'status', value: 'failed' }),
    countRows(client, 'view_count_jobs', { column: 'status', value: 'pending' }),
    countRows(client, 'view_count_jobs', { column: 'status', value: 'processing' }),
    countRows(client, 'view_count_jobs', { column: 'status', value: 'completed' }),
    countRows(client, 'view_count_jobs', { column: 'status', value: 'failed' }),
    countRows(client, 'import_items', { column: 'status', value: 'pending' }),
    countRows(client, 'import_items', { column: 'status', value: 'processing' }),
    countRows(client, 'import_items', { column: 'status', value: 'published' }),
    countRows(client, 'import_items', { column: 'status', value: 'failed' }),
    countRows(client, 'import_batches', { column: 'status', value: 'processing' }),
  ])

  const { data: latestFailedJob, error: latestFailedError } = await client
    .from('embedding_jobs')
    .select('last_error')
    .eq('status', 'failed')
    .not('last_error', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestFailedError) {
    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to fetch latest embedding worker error')
  }

  const response: WorkerStatusResponse = {
    embedding: {
      publishedArticles,
      embeddedArticles,
      coveragePercent: publishedArticles > 0 ? Math.round((embeddedArticles / publishedArticles) * 100) : 0,
      jobs: {
        pending: embeddingPending,
        processing: embeddingProcessing,
        completed: embeddingCompleted,
        failed: embeddingFailed,
      },
      latestFailure: latestFailedJob?.last_error ?? null,
    },
    viewCount: {
      jobs: {
        pending: viewPending,
        processing: viewProcessing,
        completed: viewCompleted,
        failed: viewFailed,
      },
    },
    import: {
      items: {
        pending: importPending,
        processing: importProcessing,
        published: importPublished,
        failed: importFailed,
      },
      activeBatches: importActiveBatches,
    },
    refreshedAt: new Date().toISOString(),
  }

  return successResponse(response)
})
