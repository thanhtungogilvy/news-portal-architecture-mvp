import { z } from 'zod'
import { recordView } from '../../../services/news.service'

const uuidSchema = z.string().uuid()

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') as string
  const result = uuidSchema.safeParse(id)
  if (!result.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid news ID format')
  }

  await recordView(event, result.data)
  return successResponse(null)
})
