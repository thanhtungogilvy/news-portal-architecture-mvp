import { adminNewsListQuerySchema } from '~/utils/validators/news'
import { adminListNews } from '../../../services/news.service'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const parsed = adminNewsListQuerySchema.safeParse(query)
  if (!parsed.success) {
    throw createApiError(422, 'VALIDATION_ERROR', 'Invalid query params', parsed.error.flatten())
  }

  const { items, total } = await adminListNews(event, parsed.data)
  const { page, limit } = parsed.data
  return successResponse(items, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
})
