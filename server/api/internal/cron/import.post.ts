import { serverSupabaseServiceRole } from '#supabase/server'
import { processImportItems, processBatchAlerts, recoverStuckImportItems } from '../../../../lib/background/import/service'

function verifyCronSecret(event: ReturnType<typeof defineEventHandler> extends unknown ? Parameters<typeof getHeader>[0] : never) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return
  const auth = getHeader(event, 'authorization')
  if (auth !== `Bearer ${cronSecret}`) {
    throw createApiError(401, 'UNAUTHENTICATED', 'Invalid cron secret')
  }
}

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  const client = await serverSupabaseServiceRole(event)
  const batchSize = Number(process.env.IMPORT_WORKER_BATCH_SIZE ?? '5')

  const recovered = await recoverStuckImportItems(client)
  const result = await processImportItems(client, batchSize)
  await processBatchAlerts(client)

  return successResponse({ recovered, ...result })
})
