import { z } from 'zod'
import { recordArticleView } from '../../../services/recommendation.service'

const uuidSchema = z.string().uuid()

const bodySchema = z.object({
  sessionId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const idResult = uuidSchema.safeParse(id)
  if (!idResult.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid news ID format')
  }

  const body = await readBody(event)
  const bodyResult = bodySchema.safeParse(body)
  if (!bodyResult.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'sessionId is required in request body')
  }

  try {
    await recordArticleView(event, bodyResult.data.sessionId, idResult.data)
    setResponseStatus(event, 201)
  } catch (err) {
    // Non-critical — table may not exist yet (migration pending). Log and continue.
    console.warn('[history] recordArticleView failed:', err instanceof Error ? err.message : err)
  }
  return successResponse(null)
})
