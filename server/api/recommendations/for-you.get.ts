import { z } from 'zod'
import { getPersonalizedRecommendations } from '../../services/recommendation.service'

const querySchema = z.object({
  sessionId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const raw = getQuery(event)
  const result = querySchema.safeParse(raw)
  if (!result.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'sessionId query parameter is required')
  }

  try {
    const articles = await getPersonalizedRecommendations(event, result.data.sessionId)
    return successResponse(articles)
  } catch (err) {
    console.warn('[for-you] unhandled error, returning empty:', err instanceof Error ? err.message : err)
    return successResponse([])
  }
})
