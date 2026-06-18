import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../../app/types/database.types'
import {
  claimPendingEmbeddingJobs,
  completeJob,
  failJob,
} from '../../../server/repositories/embedding-job.repository'
import { generateAndSaveEmbedding } from '../../../server/services/embedding.service'

type AppSupabaseClient = SupabaseClient<Database>

export async function processPendingEmbeddingJobs(
  client: AppSupabaseClient,
  batchSize = 10,
): Promise<{ claimed: number, completed: number, failed: number }> {
  const jobs = await claimPendingEmbeddingJobs(client, batchSize)

  let completed = 0
  let failed = 0

  for (const job of jobs) {
    try {
      await generateAndSaveEmbedding(client, job.article_id)
      await completeJob(client, job.id)
      completed += 1
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown embedding worker error'
      await failJob(client, job.id, message)
      failed += 1
    }
  }

  return {
    claimed: jobs.length,
    completed,
    failed,
  }
}
