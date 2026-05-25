import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../../../app/types/database.types'
import { ViewCountJobError } from './errors'

type AppSupabaseClient = SupabaseClient<Database>
export type ViewCountJobRow = Tables<'view_count_jobs'>

export async function insertViewCountJob(
  client: AppSupabaseClient,
  newsId: string,
): Promise<void> {
  const { error } = await client
    .from('view_count_jobs')
    .insert({ news_id: newsId })

  if (!error) return

  if (error.code === '23503') {
    throw new ViewCountJobError('NEWS_NOT_FOUND', 'News not found')
  }

  throw new ViewCountJobError('INSERT_FAILED', 'Failed to create view-count job')
}

export async function claimPendingViewCountJobs(
  client: AppSupabaseClient,
  batchSize: number,
): Promise<ViewCountJobRow[]> {
  const { data, error } = await client.rpc('claim_pending_view_count_jobs', {
    batch_size: Math.max(batchSize, 1),
  })

  if (error) {
    throw new ViewCountJobError('CLAIM_FAILED', 'Failed to claim pending view-count jobs')
  }

  return (data ?? []) as ViewCountJobRow[]
}

export async function markViewCountJobCompleted(
  client: AppSupabaseClient,
  jobId: string,
): Promise<void> {
  const { error } = await client
    .from('view_count_jobs')
    .update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', jobId)

  if (error) {
    throw new ViewCountJobError('MARK_FAILED', 'Failed to mark view-count job completed')
  }
}

export async function markViewCountJobFailed(
  client: AppSupabaseClient,
  jobId: string,
  message: string,
): Promise<void> {
  const { error } = await client
    .from('view_count_jobs')
    .update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      last_error: message,
    })
    .eq('id', jobId)

  if (error) {
    throw new ViewCountJobError('MARK_FAILED', 'Failed to mark view-count job failed')
  }
}

export async function incrementNewsViewCount(
  client: AppSupabaseClient,
  newsId: string,
): Promise<void> {
  const { data: found, error } = await client.rpc('increment_news_view_count', { news_id: newsId })

  if (error) {
    throw new ViewCountJobError('INCREMENT_FAILED', 'Failed to increment news view count')
  }

  if (!found) {
    throw new ViewCountJobError('NEWS_NOT_FOUND', 'News not found')
  }
}
