import { z } from 'zod'
import { getSimilarArticles } from '../../../services/recommendation.service'

const uuidSchema = z.string().uuid()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const result = uuidSchema.safeParse(id)
  if (!result.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid news ID format')
  }

  try {
    const articles = await getSimilarArticles(event, result.data)
    return successResponse(articles)
  } catch (err) {
    console.warn('[similar] unhandled error, returning empty:', err instanceof Error ? err.message : err)
    return successResponse([])
  }
})
