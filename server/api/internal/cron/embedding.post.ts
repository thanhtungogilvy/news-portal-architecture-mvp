import { serverSupabaseServiceRole } from '#supabase/server'
import { processPendingEmbeddingJobs } from '../../../../lib/background/embedding/service'

// Guard: same pattern as view-count and import cron routes.
// Vercel Cron sets Authorization: Bearer <CRON_SECRET> automatically.
// pg_cron/pg_net sends it from internal_settings.cron_secret.
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
  const batchSize = Number(process.env.EMBEDDING_WORKER_BATCH_SIZE ?? '10')

  const result = await processPendingEmbeddingJobs(client, batchSize)
  return successResponse(result)
})
