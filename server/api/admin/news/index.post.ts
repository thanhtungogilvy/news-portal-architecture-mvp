import { newsCreateSchema } from '~/utils/validators/news'
import { adminCreateNews } from '../../../services/news.service'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)

  const body = await readBody(event)
  const parsed = newsCreateSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten())
  }

  const news = await adminCreateNews(event, parsed.data, user.id)
  setResponseStatus(event, 201)
  return successResponse(news)
})
