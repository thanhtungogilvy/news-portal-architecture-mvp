import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../app/types/database.types'
import {
  claimPendingViewCountJobs,
  incrementNewsViewCount,
  insertViewCountJob,
  markViewCountJobCompleted,
  markViewCountJobFailed,
} from './repository'

type AppSupabaseClient = SupabaseClient<Database>

export async function enqueueViewCountJob(
  client: AppSupabaseClient,
  newsId: string,
): Promise<void> {
  await insertViewCountJob(client, newsId)
}

export async function processPendingViewCountJobs(
  client: AppSupabaseClient,
  batchSize = 25,
): Promise<{ claimed: number, completed: number, failed: number }> {
  const jobs = await claimPendingViewCountJobs(client, batchSize)

  let completed = 0
  let failed = 0

  for (const job of jobs) {
    try {
      await incrementNewsViewCount(client, job.news_id)
      await markViewCountJobCompleted(client, job.id)
      completed += 1
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown worker error'
      await markViewCountJobFailed(client, job.id, message)
      failed += 1
    }
  }

  return {
    claimed: jobs.length,
    completed,
    failed,
  }
}
