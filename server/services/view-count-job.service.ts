import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { enqueueViewCountJob } from '../../lib/background/view-count/service'
import { ViewCountJobError } from '../../lib/background/view-count/errors'

export async function queueViewCountJob(
  event: H3Event,
  newsId: string,
): Promise<void> {
  const client = await serverSupabaseServiceRole(event)

  try {
    await enqueueViewCountJob(client, newsId)
  }
  catch (error: unknown) {
    if (error instanceof ViewCountJobError && error.code === 'NEWS_NOT_FOUND') {
      throw createApiError(404, 'NOT_FOUND', 'News not found')
    }

    throw createApiError(500, 'INTERNAL_ERROR', 'Failed to queue view-count job')
  }
}
