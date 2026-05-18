import { newsListQuerySchema } from '~/utils/validators/news'
import { listNews } from '../../services/news.service'

export default defineEventHandler(async (event) => {
  const raw = getQuery(event)
  const result = newsListQuerySchema.safeParse(raw)
  if (!result.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid query parameters', result.error.flatten())
  }

  const { items, total } = await listNews(event, result.data)
  const { page, limit } = result.data

  return successResponse(items, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
})
