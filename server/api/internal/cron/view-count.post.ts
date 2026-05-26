import { serverSupabaseServiceRole } from '#supabase/server'
import { processPendingViewCountJobs } from '../../../../lib/background/view-count/service'

// Guard: Vercel Cron sets Authorization: Bearer <CRON_SECRET>
// https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
function verifyCronSecret(event: ReturnType<typeof defineEventHandler> extends unknown ? Parameters<typeof getHeader>[0] : never) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return // not configured → skip guard (dev/test)
  const auth = getHeader(event, 'authorization')
  if (auth !== `Bearer ${cronSecret}`) {
    throw createApiError(401, 'UNAUTHENTICATED', 'Invalid cron secret')
  }
}

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  const client = await serverSupabaseServiceRole(event)
  const batchSize = Number(process.env.VIEW_COUNT_WORKER_BATCH_SIZE ?? '25')

  const result = await processPendingViewCountJobs(client, batchSize)
  return successResponse(result)
})
