import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../../app/types/database.types'

type AppSupabaseClient = SupabaseClient<Database>
export type EmbeddingJobRow = Tables<'embedding_jobs'>

/**
 * Insert a new pending embedding job for the given article.
 * Silently ignores FK violations (article not found) — the caller handles this.
 */
export async function enqueueEmbeddingJob(
  client: AppSupabaseClient,
  articleId: string,
): Promise<void> {
  const { error } = await client
    .from('embedding_jobs')
    .insert({ article_id: articleId })

  if (error) {
    throw new Error(`[embedding-job.repository] enqueueEmbeddingJob failed: ${error.message}`)
  }
}

/**
 * Atomically claim up to batchSize pending jobs, moving them to 'processing'.
 * Uses FOR UPDATE SKIP LOCKED so concurrent workers never claim the same row.
 */
export async function claimPendingEmbeddingJobs(
  client: AppSupabaseClient,
  batchSize: number,
): Promise<EmbeddingJobRow[]> {
  const normalizedBatchSize = Math.max(batchSize, 1)

  const firstAttempt = await client.rpc('claim_pending_embedding_jobs', {
    batch_size: normalizedBatchSize,
  })

  if (!firstAttempt.error) {
    return (firstAttempt.data ?? []) as EmbeddingJobRow[]
  }

  // Some DB environments may expose this function with a positional argument
  // (or default-only argument) without the `batch_size` name in schema cache.
  // Retry without named args to keep the worker resilient.
  const shouldRetryWithoutArgs
    = firstAttempt.error.message.includes('claim_pending_embedding_jobs(batch_size)')

  if (!shouldRetryWithoutArgs) {
    throw new Error(`[embedding-job.repository] claimPendingEmbeddingJobs failed: ${firstAttempt.error.message}`)
  }

  const secondAttempt = await client.rpc('claim_pending_embedding_jobs')

  if (secondAttempt.error) {
    throw new Error(`[embedding-job.repository] claimPendingEmbeddingJobs failed: ${secondAttempt.error.message}`)
  }

  return (secondAttempt.data ?? []) as EmbeddingJobRow[]
}

/**
 * Mark an embedding job as completed.
 */
export async function completeJob(
  client: AppSupabaseClient,
  jobId: string,
): Promise<void> {
  const { error } = await client
    .from('embedding_jobs')
    .update({
      status: 'completed',
      finished_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', jobId)

  if (error) {
    throw new Error(`[embedding-job.repository] completeJob failed: ${error.message}`)
  }
}

/**
 * Mark an embedding job as failed with an error message.
 */
export async function failJob(
  client: AppSupabaseClient,
  jobId: string,
  errorMessage: string,
): Promise<void> {
  const { error } = await client
    .from('embedding_jobs')
    .update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      last_error: errorMessage,
    })
    .eq('id', jobId)

  if (error) {
    throw new Error(`[embedding-job.repository] failJob failed: ${error.message}`)
  }
}
